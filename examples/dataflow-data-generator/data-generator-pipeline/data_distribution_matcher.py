# Copyright 2018 Google Inc.
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#      http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.
"""
A Dataflow pipeline which reads a schema to simulate or "fake" data
from a json file and writes random data of the schema's shape to a
BigQuery table or as CSV or AVRO files on GCS. This can be used to
ease apprehension about BQ costs, unblock integration testing before
real data can be provided by the business, or create dummy datasets
for stress testing in the event of large data growth.
"""

import json
import logging

import apache_beam as beam
from apache_beam.options.pipeline_options import PipelineOptions
from data_generator.PerformantDataGenerator import DataGenerator, FakeRowGen, \
    parse_data_generator_args, validate_data_args, fetch_schema
import fastavro

from data_generator.CsvUtil import dict_to_csv
from data_generator.AvroUtil import fix_record_for_avro


def run(argv=None):
    """
    This funciton parses the command line arguments and runs the Beam Pipeline.

    Args:
        argv: list containing the commandline arguments for this call of the
         script.
    """
    schema_inferred = False
    data_args, pipeline_args = parse_data_generator_args(argv)
    data_args, schema_inferred = fetch_schema(data_args, schema_inferred)
    pipeline_options = PipelineOptions(pipeline_args)

    data_gen = DataGenerator(bq_schema_filename=data_args.schema_file,
                             input_bq_table=data_args.input_bq_table,
                             hist_bq_table=data_args.hist_bq_table,
                             p_null=data_args.p_null,
                             n_keys=data_args.n_keys,
                             min_date=data_args.min_date,
                             max_date=data_args.max_date,
                             only_pos=data_args.only_pos,
                             max_int=data_args.max_int,
                             max_float=data_args.max_float,
                             float_precision=data_args.float_precision,
                             write_disp=data_args.write_disp,
                             key_skew=data_args.key_skew)

    # Initiate the pipeline using the pipeline arguments passed in from the
    # command line.  This includes information including where Dataflow should
    # store temp files, and what the project id is and what runner to use.
    p = beam.Pipeline(options=pipeline_options)
    rows = (
        p
        | 'Read Histogram Table.' >> beam.io.Read(
            beam.io.BigQuerySource(data_gen.hist_bq_table))
        | 'Generate Data' >> beam.ParDo(FakeRowGen(data_gen))
        | 'Parse Json Strings' >> beam.FlatMap(lambda row: [json.loads(row)]))

    if data_args.primary_key_cols:
        rows |= EnforcePrimaryKeys(data_args.primary_key_col)

    if data_args.csv_schema_order:
        (rows
         | 'Order fields for CSV writing.' >> beam.FlatMap(
             lambda d: [dict_to_csv(d, data_args.csv_schema_order.split(','))])
         | 'Write to GCS' >> beam.io.textio.WriteToText(
             file_path_prefix=data_args.output_prefix, file_name_suffix='.csv')
         )

    if data_args.avro_schema_file:
        fastavro_avsc = fastavro.schema.load_schema(data_args.avro_schema_file)

        (rows
         # Need to convert time stamps from strings to timestamp-micros
         | 'Fix date and time Types for Avro.' >>
         beam.FlatMap(lambda row: fix_record_for_avro(row, fastavro_avsc))
         | 'Write to Avro.' >> beam.io.avroio.WriteToAvro(
             file_path_prefix=data_args.output_prefix,
             codec='null',
             file_name_suffix='.avro',
             use_fastavro=True,
             schema=fastavro_avsc))

    if data_args.output_bq_table:
        (rows
         | 'Write to BigQuery.' >> beam.io.gcp.bigquery.WriteToBigQuery(
             # The table name is a required argument for the BigQuery sink.
             # In this case we use the value passed in from the command line.
             data_args.output_bq_table,
             schema=None if schema_inferred else data_gen.get_bq_schema(),
             # Creates the table in BigQuery if it does not yet exist.
             create_disposition=beam.io.BigQueryDisposition.CREATE_IF_NEEDED,
             write_disposition=data_gen.write_disp,
             # Use the max recommended batch size.
             batch_size=500))

    p.run().wait_until_finish()


if __name__ == '__main__':
    logging.getLogger().setLevel(logging.INFO)
    run()
