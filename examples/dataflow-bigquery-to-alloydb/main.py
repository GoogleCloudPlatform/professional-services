"""This module shows how to move data from BigQuery to AlloyDB using Dataflow"""

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
import typing
import apache_beam as beam
from apache_beam.options.pipeline_options import PipelineOptions
from apache_beam.options.pipeline_options import SetupOptions
from apache_beam.io.jdbc import WriteToJdbc
from apache_beam import coders

class EthereumTokenTransfersRowType(typing.NamedTuple):
    """Class that defines the Row Type of the AlloyDB table"""
    from_address:str
    to_address:str
    value:float
    block_timestamp:str

def run(argv=None, save_main_session=True):
    """Runs the pipeline"""

    parser = argparse.ArgumentParser()
    parser.add_argument(
        '--alloydb_username',
        dest='alloydb_username',
        required=True,
        help='AlloyDB username')
    parser.add_argument(
        '--alloydb_password',
        dest='alloydb_password',
        required=True,
        help='AlloyDB password')
    parser.add_argument(
        '--alloydb_ip',
        dest='alloydb_ip',
        required=True,
        help='AlloyDB IP Address')
    parser.add_argument(
        '--alloydb_port',
        dest='alloydb_port',
        default="5432",
        help='AlloyDB Port')
    parser.add_argument(
        '--alloydb_database',
        dest='alloydb_database',
        required=True,
        help='AlloyDB Database name')
    parser.add_argument(
        '--alloydb_table',
        dest='alloydb_table',
        required=True,
        help='AlloyDB table name')
    parser.add_argument(
        '--bq_query',
        dest='bq_query',
        required=True,
        help='Query to be executed by BigQuery for extracting the source data')
    known_args, pipeline_args = parser.parse_known_args(argv)

    pipeline_options = PipelineOptions(pipeline_args)
    pipeline_options.view_as(SetupOptions).save_main_session = save_main_session

    with beam.Pipeline(options=pipeline_options) as p:
        coders.registry.register_coder(EthereumTokenTransfersRowType, coders.RowCoder)

        (
            p | 'ReadFromBigQuery' >> beam.io.ReadFromBigQuery(
                query=known_args.bq_query,
                use_standard_sql=True
            )
            | 'ConvertToRows' >> beam.Map(lambda bq_row: beam.Row(
                    from_address=bq_row['from_address'],
                    to_address=bq_row['to_address'],
                    value=bq_row['value'],
                    block_timestamp=bq_row['block_timestamp'].isoformat()
            )
            ).with_output_types(EthereumTokenTransfersRowType)
            | 'Write to jdbc' >> WriteToJdbc(
                    driver_class_name='org.postgresql.Driver',
                    table_name=known_args.alloydb_table,
                    jdbc_url=(
                        f'jdbc:postgresql://{known_args.alloydb_ip}:'
                        f'{known_args.alloydb_port}/{known_args.alloydb_database}'
                    ),
                    username=known_args.alloydb_username,
                    password=known_args.alloydb_password,
                    connection_properties='stringtype=unspecified'
            )
        )

if __name__ == '__main__':
    logging.getLogger().setLevel(logging.INFO)
    run()
