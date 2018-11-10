# Copyright 2017 Google Inc.
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
data_generation_for_bq.py is a Dataflow pipeline which reads
a schema to simulate or "fake" data from a json file and writes
random data of the schema's shape to a BigQuery table. This can be used
to ease apprehension about BQ costs, unblock integration testing before
real data can be provided by the business, or create dummy datasets for
stress testing in the event of large data growth.
"""

from __future__ import absolute_import
import json
import logging

import apache_beam as beam
from apache_beam.options.pipeline_options import PipelineOptions
from data_generator.DataGenerator import DataGenerator, FakeRowGen, \
    LimitBundles, parse_data_generator_args, validate_data_args, fetch_schema,\
    write_n_line_file_to_gcs


def run(argv=None):
    """
    This funciton parses the command line arguments and runs the Beam Pipeline.

    Args:
        argv: list containing the commandline arguments for this call of the
         script.
    """
    # Keeps track if schema was inferred by input or output table.
    schema_inferred = False

    data_args, pipeline_args = parse_data_generator_args(argv)
    data_args, schema_inferred = fetch_schema(data_args, schema_inferred)
    pipeline_options = PipelineOptions(pipeline_args)

    temp_location = pipeline_options.display_data()['temp_location']
    temp_blob = write_n_line_file_to_gcs(
        pipeline_options.display_data()['project'],
        temp_location,
        data_args.num_records)

    data_gen = DataGenerator(bq_schema_filename=data_args.schema_file,
                             input_bq_table=data_args.input_bq_table,
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

    (p

     # Read the file we created with num_records newlines.
     #
     | 'Read file with num_records lines' >> beam.io.ReadFromText(
                '/'.join(['gs:/', temp_blob.bucket.name, temp_blob.name])
            )

     # Use our instance of our custom DataGenerator Class to generate 1 fake
     # datum with the appropriate schema for each element in the PColleciton
     # created above.
     | 'Generate Data' >> beam.ParDo(FakeRowGen(data_gen))

     | 'Parse Strings' >> beam.FlatMap(lambda row: [json.loads(row)])

    #TODO write to avro files instead. (won't need Limit Sharding Transform).

     # Manually shard data to avoid creating too many shard for bq load.
     | 'Limit sharding' >> LimitBundles(10000)

     | 'Write to BigQuery' >> beam.io.WriteToBigQuery(
         # The table name is a required argument for the BigQuery sink.
         # In this case we use the value passed in from the command line.
         data_args.output_bq_table,
         schema=None if schema_inferred else data_gen.get_bq_schema_string(),
         # Creates the table in BigQuery if it does not yet exist.
         create_disposition=beam.io.BigQueryDisposition.CREATE_IF_NEEDED,
         write_disposition=data_gen.write_disp,
         # Use the max recommended batch size.
         batch_size=500)
    )

    p.run().wait_until_finish()

    # Manually clean up of temp_num_records.txt because it will be outside this
    # job's directory and Dataflow will not remove it for us.
    temp_blob.delete()


if __name__ == '__main__':
    logging.getLogger().setLevel(logging.INFO)
    run()

