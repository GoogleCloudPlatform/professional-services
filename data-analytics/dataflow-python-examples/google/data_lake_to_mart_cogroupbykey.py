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

 To run this script, set up your python environment by running these commands:

 virtualenv env
 . ./env/bin/activate
 pip install apache-beam
 pip install apache_beam[gcp]
 python ./google/data_ingestion.py --project=insert-your-project-here


 Apache Beam setup instructions in more detail:
    https://beam.apache.org/get-started/quickstart-py/

 Virtual Env and Pip Command Explanation:
  https://www.dabapps.com/blog/introduction-to-pip-and-virtualenv-python/
"""

from __future__ import absolute_import
import argparse
import csv
import logging
import os
import apache_beam as beam
from apache_beam.io.gcp.bigquery import parse_table_schema_from_json
from apache_beam.options.pipeline_options import PipelineOptions
from apache_beam.pvalue import AsDict


class DataIngestion:
    def __init__(self):
        """"""
        dir_path = os.path.dirname(os.path.realpath(__file__))
        self.schema_str = ''
        #this is the schem of output file
        with open(dir_path + '/resources/orders_denormalized.json') \
                as f:
            data = f.read()
            # Wrapping the schema in fields: is required for the BigQuery API
            self.schema_str = '{"fields": ' + data + '}'




def run(argv=None):
    """The main function which creates the pipeline and runs it"""
    # This object helps us parse command line arguments
    parser = argparse.ArgumentParser()
    # Here we add some specific command line arguments we expect.   S
    # This defaults the output table in your BigQuery you'll have
    # to create the example_data dataset yourself using bq mk temp
    parser.add_argument('--output', dest='output', required=False,
                        help='Output BQ table to write results to.',
                        default='lake.orders_denormalized_cogroupbykey')

    # Parse arguments from the command line
    known_args, pipeline_args = parser.parse_known_args(argv)

    # DataIngestion is a class we built in this script to hold the logic for
    # transforming the file into a BigQuery table
    data_ingestion = DataIngestion()

    schema = parse_table_schema_from_json(data_ingestion.schema_str)
    pipeline = beam.Pipeline(options=PipelineOptions(pipeline_args))

    # This function performs the "join" of the two datasets.
    def add_account_details((acct_number, data)):
        import traceback
        if len(data['account_details']) is 0:
            logging.info( 'account details is empty')
            return
        if len(data['orders']) is 0:
            logging.info( 'orders is empty')
            return


        account_details = {}
        try:
            account_details = data['account_details'][0]


        except KeyError as err:
            traceback.print_exc()
            logging.error("Account Not Found error: {0}".format(err))

        for order in data['orders']:
            order.update(account_details)

        return data['orders']
    """
        This query returns details about the account, normalized into a 
        different table.
        
        We will be joining the data in to the main orders dataset in order
        to create a denormalized table.
        
     """
    account_details = (
        pipeline
        | 'Read Account Details from BigQuery ' >> beam.io.Read(
            beam.io.BigQuerySource(query="""
                #standardSql
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
        # a given account number will run on one worker
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
                    #standardSql
                    SELECT
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
        # a given account number will run on one worker
        'Map Account to Account Details' >> beam.Map(
            lambda row: (
                row['acct_number'], row
            )))

    # CoGroupByKey allows us to arrange the results together by key
    # Both "orders" and "account_details" are maps of
    #  acct_number -> "Row of results from BigQuery"
    # The mapping is done in the above code using Beam.Map()
    result = {'orders' : orders, 'account_details': account_details} | \
             beam.CoGroupByKey()
    # The add_account_details function is responsible for defining how to
    # Join the two datasets.  It passes the results of CoGroupByKey, which
    # groups the data from the same key in each dataset together in the same
    # worker
    joined = result | beam.FlatMap(add_account_details)
    joined | 'Write Data to BigQuery' >> beam.io.Write(
        beam.io.BigQuerySink(
            # The table name passed in from the command line
            known_args.output,
            # Here we use the JSON schema read in from a JSON file.
            schema=schema,
            # Creates the table in BigQuery if it does not yet exist
            create_disposition=beam.io.BigQueryDisposition.CREATE_IF_NEEDED,
            # Deletes all data in the BigQuery table before writing
            write_disposition=beam.io.BigQueryDisposition.WRITE_TRUNCATE))

    pipeline.run()

if __name__ == '__main__':
    logging.getLogger().setLevel(logging.INFO)
    run()
