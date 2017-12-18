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

""" data_lake_to_mart.py demonstrates a Dataflow pipeline which reads a 
large BigQuery Table, joins in another dataset, and writes its contents to a 
BigQuery table.  
"""

from __future__ import absolute_import
import argparse
import logging
import os
import traceback

import apache_beam as beam
from apache_beam.io.gcp.bigquery import parse_table_schema_from_json
from apache_beam.options.pipeline_options import PipelineOptions


class DataLakeToDataMartCGBK:
    """A helper class which contains the logic to translate the file into 
    a format BigQuery will accept.
    
    This example uses CoGroupByKey to join two datasets together.
    """

    def __init__(self):
        dir_path = os.path.dirname(os.path.realpath(__file__))
        self.schema_str = ''
        # This is the schema of the destination table in BigQuery.
        schema_file = os.path.join(dir_path, 'resources', 'orders_denormalized.json')
        with open(schema_file) \
                as f:
            data = f.read()
            # Wrapping the schema in fields is required for the BigQuery API.
            self.schema_str = '{"fields": ' + data + '}'

    def add_account_details(self, (acct_number, data)):
        """This function performs the join of the two datasets."""
        result = list(data['orders'])
        if not data['account_details']:
            logging.info('account details are empty')
            return
        if not data['orders']:
            logging.info('orders are empty')
            return

        account_details = {}
        try:
            account_details = data['account_details'][0]
        except KeyError as err:
            traceback.print_exc()
            logging.error("Account Not Found error: %s", err)

        for order in result:
            order.update(account_details)

        return result


def run(argv=None):
    """The main function which creates the pipeline and runs it."""
    parser = argparse.ArgumentParser()
    # Here we add some specific command line arguments we expect.
    # This defaults the output table in your BigQuery you'll have
    # to create the example_data dataset yourself using bq mk temp
    parser.add_argument('--output', dest='output', required=False,
                        help='Output BQ table to write results to.',
                        default='lake.orders_denormalized_cogroupbykey')

    # Parse arguments from the command line.
    known_args, pipeline_args = parser.parse_known_args(argv)

    # DataLakeToDataMartCGBK is a class we built in this script to hold the logic for
    # transforming the file into a BigQuery table.  It also contains an example of
    # using CoGroupByKey
    data_lake_to_data_mart = DataLakeToDataMartCGBK()

    schema = parse_table_schema_from_json(data_lake_to_data_mart.schema_str)
    pipeline = beam.Pipeline(options=PipelineOptions(pipeline_args))

    # This query returns details about the account, normalized into a
    # different table.  We will be joining the data in to the main orders dataset in order
    # to create a denormalized table.
    account_details_source = (
        pipeline
        | 'Read Account Details from BigQuery ' >> beam.io.Read(
            beam.io.BigQuerySource(query="""
                SELECT
                  acct_number,
                  acct_company_name,
                  acct_group_name,
                  acct_name,
                  acct_org_name,
                  address,
                  city,
                  state,
                  zip_code,
                  country
                FROM
                  `python-dataflow-example.example_data.account`
            """, use_standard_sql=True))
        # This next stage of the pipeline maps the acct_number to a single row of
        # results from BigQuery.  Mapping this way helps Dataflow move your data arround
        # to different workers.  When later stages of the pipeline run, all results from
        # a given account number will run on one worker.
        | 'Map Account to Order Details' >> beam.Map(
            lambda row: (
                row['acct_number'], row
            )))

    # Read the orders from BigQuery.  This is the source of the pipeline.  All further
    # processing starts with rows read from the query results here.
    orders = (
        pipeline
        | 'Read Orders from BigQuery ' >> beam.io.Read(
            beam.io.BigQuerySource(query="""
                                    SELECT
                               -- select * is not recommended in production code.  For brevity, 
                               -- we have included it here.  In production code it is recommended
                               -- to explicitly the list the columns.
                                      *
                                    FROM
                                      `python-dataflow-example.example_data.orders` orders
                                    LIMIT
                                      10       
                                     """, use_standard_sql=True))
        |
        # This next stage of the pipeline maps the acct_number to a single row of
        # results from BigQuery.  Mapping this way helps Dataflow move your data around
        # to different workers.  When later stages of the pipeline run, all results from
        # a given account number will run on one worker.
        'Map Account to Account Details' >> beam.Map(
            lambda row: (
                row['acct_number'], row
            )))

    # CoGroupByKey allows us to arrange the results together by key
    # Both "orders" and "account_details" are maps of
    # acct_number -> "Row of results from BigQuery".
    # The mapping is done in the above code using Beam.Map()
    result = {'orders': orders, 'account_details': account_details_source} | \
             beam.CoGroupByKey()
    # The add_account_details function is responsible for defining how to
    # join the two datasets.  It passes the results of CoGroupByKey, which
    # groups the data from the same key in each dataset together in the same
    # worker.
    joined = result | beam.FlatMap(data_lake_to_data_mart.add_account_details)
    joined | 'Write Data to BigQuery' >> beam.io.Write(
        beam.io.BigQuerySink(
            # The table name is a required argument for the BigQuery sink.
            # In this case we use the value passed in from the command line.
            known_args.output,
            # Here we use the JSON schema read in from a JSON file.
            # Specifying the schema allows the API to create the table correctly if it does not yet exist.
            schema=schema,
            # Creates the table in BigQuery if it does not yet exist.
            create_disposition=beam.io.BigQueryDisposition.CREATE_IF_NEEDED,
            # Deletes all data in the BigQuery table before writing.
            write_disposition=beam.io.BigQueryDisposition.WRITE_TRUNCATE))

    pipeline.run().wait_until_finish()


if __name__ == '__main__':
    logging.getLogger().setLevel(logging.INFO)
    run()
