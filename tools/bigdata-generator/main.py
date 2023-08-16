"""Module that executes the main flow for generating/loading the generated data"""

#   Copyright 2023 Google LLC All Rights Reserved
#
#   Licensed under the Apache License, Version 2.0 (the "License");
#   you may not use this file except in compliance with the License.
#   You may obtain a copy of the License at
#
#       http://www.apache.org/licenses/LICENSE-2.0
#
#   Unless required by applicable law or agreed to in writing, software
#   distributed under the License is distributed on an "AS IS" BASIS,
#   WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
#   See the License for the specific language governing permissions and
#   limitations under the License.

import argparse
import logging
import apache_beam as beam
from apache_beam.io.avroio import WriteToAvro
from apache_beam.options.pipeline_options import PipelineOptions
from apache_beam.options.pipeline_options import SetupOptions
from lib import RowGenerator, ConfigFileValidator, PipelineHelper


def run(argv=None, save_main_session=True):
    parser = argparse.ArgumentParser()
    parser.add_argument(
        '--config_file_path',
        dest='config_file_path',
        help='config file to process.')
    known_args, pipeline_args = parser.parse_known_args(argv)

    pipeline_options = PipelineOptions(pipeline_args)
    pipeline_options.view_as(SetupOptions).save_main_session = save_main_session

    pipeline_helper = PipelineHelper(
        config_file_path=known_args.config_file_path
    )

    logging.info('Config data:')
    logging.info(pipeline_helper.get_config())

    # Validate the config file
    config_file_validator = ConfigFileValidator(
        config=pipeline_helper.get_config()
    )
    config_file_errors, config_file_warnings = config_file_validator.validate()

    for warning in config_file_warnings:
        logging.warning(warning)

    for error in config_file_errors:
        logging.error(error)

    if len(config_file_errors) > 0:
        raise Exception('Errors in the config file were found, stopping execution.')

    with beam.Pipeline(options=pipeline_options) as p:
        # Generate the data
        elements = (
            p
            | 'CreateBatches' >> beam.Create(pipeline_helper.get_batches())
            | 'GenerateRows' >> beam.ParDo(
                RowGenerator(
                    config=pipeline_helper.get_config()
                    )
                )
        )

        # write the generated data to the sinks defined in the config file
        for sink in pipeline_helper.get_config().sinks:
            if sink['type'] == 'BIGQUERY':
                bigquery_table_id = sink['table_id']
                write_disposition = sink['write_disposition']

                elements | 'WriteBQ' >> beam.io.WriteToBigQuery(
                    table=bigquery_table_id,
                    write_disposition=write_disposition,
                    create_disposition=beam.io.BigQueryDisposition.CREATE_NEVER #table should already exist
                )
            elif sink['type'] == 'GCS-AVRO':
                location = sink['location']
                avro_schema = sink['schema']

                elements | 'WriteGCS-AVRO' >> WriteToAvro(
                    location,
                    avro_schema,
                    file_name_suffix='.avro',
                    use_fastavro = True
                )
            elif sink['type'] == 'GCS-CSV':
                location = sink['location']
                delimiter = sink['delimiter']

                header = delimiter.join([x['name'] for x in pipeline_helper.get_config().fields])

                elements | 'FormatCSV' >> beam.Map(
                        lambda row: delimiter.join([str(row[column]) for column in row])
                    ) |'WriteGCS-CSV' >> beam.io.WriteToText(
                            location,
                            file_name_suffix='.csv', header=header
                        )


if __name__ == '__main__':
    logging.getLogger().setLevel(logging.INFO)
    run()
