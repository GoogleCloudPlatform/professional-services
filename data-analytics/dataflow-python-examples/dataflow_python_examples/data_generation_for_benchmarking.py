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
data_generation_for_benchmarking.py is a Dataflow pipeline which reads
a schema to simulate or "fake" data from a json file and writes
random data of the schema's shape to a BigQuery table. This can be used
to ease apprehension about BQ costs, unblock integration testing before
real data can be provided by the business, or create dummy datasets for
stress testing in the event of large data growth.
"""

from __future__ import absolute_import
import argparse
import datetime
import json
import logging
import math
import numpy as np

import apache_beam as beam
from apache_beam.options.pipeline_options import PipelineOptions
from faker import Faker
from faker_schema.faker_schema import FakerSchema
from google.cloud import bigquery as bq
from google.cloud import storage as gcs
from google.cloud.exceptions import NotFound


# Maps a faker_schema out of the DataGenerator object's schema (a BigQuery schema).
_TYPE_MAP = {
    'FLOAT': 'pyfloat',
    'INTEGER': 'random_number',
    'STRING': 'word',
    'DATE': 'date_this_century',
    'DATETIME': 'date_time_this_century',
    'BOOLEAN': 'boolean',
    'TIMESTAMP': 'date_time_this_century',
    'RECORD': 'pystruct',
    'ARRAY': 'pylist',
    'TIME': 'time',
    'BYTES': 'pystr'
}

# Use more specific Faker providers by looking for these keys as a substring of the
# field name in the schema.
# (See documention at https://faker.readthedocs.io/en/latest/providers.html ).
_SPECIAL_MAP = {
    'address': 'address',
    'file': 'file_name',
    'color': 'color_name',
    'zip': 'zipcode',
    'phone': 'phone_number',
    'name': 'name',
    'company': 'company',
    'month': 'month',
    'city': 'city',
    'state': 'state',
    'country': 'country',
    'username': 'user_name',
    'email': 'email',
    'num': 'random_number',
    'description': 'paragraph'
}


class DataGenerator(object):
    """
    A class which contains the logic for data generation.

    Attributes:
        null_prob: A float specifying the desired sparsity of the generated data.
        n_keys: An integer specifying the cardinality of foreign key columns
                (for generating joinable schemas).
        min_date: A datetime.date object specifying the earliest date to generate.
        max_date: A datetime.date object specifying the latest date to generate.
        only_pos: A boolean specifying whether to allow negative numbers to be generated.
        max_int: An integer defining the upper bound for the range of integers to generate.
        max_float: A float specifying the upper bound for the range of floats to generate.
        float_precision: An integer specifying the desired precision for generated floats.

    """
    def __init__(self, bq_schema_filename=None, input_bq_table=None, p_null=0.1, n_keys=1000,
                 min_date=datetime.date(2000, 1, 1), max_date=datetime.date.today(),
                 only_pos=True, max_int=10**11, max_float=float(10**11), float_precision=2,
                 write_disp='WRITE_APPEND'):
        """
        Args:
            bq_schema_filename: A string containing a path to a local or gcs file containing a
                                BigQuery schema in a json file.
            p_null: A float specifying the desired sparsity of the generated data.
            n_keys: An integer specifying the cardinality of foreign key columns
                    (for generating joinable schemas).
            min_date: A datetime string specifying the earliest date to generate in YYYY-MM-DD.
            max_date: A datetime string  specifying the latest date to generate in YYYY-MM-DD.
            only_pos: A boolean specifying whether to allow negative numbers to be generated.
            max_int: An integer defining the upper bound for the range of integers to generate.
            max_float: A float specifying the upper bound for the range of floats to generate.
            float_precision: An integer specifying the desired precision for generated floats.
            write_disp: A string specifying the write disposition for BigQueryTable.
        """
        if bq_schema_filename:
            try:
                # Handles json from google cloud storage or local.
                if bq_schema_filename.startswith('gs://'):
                    bkt, path = bq_schema_filename.strip('gs://').split('/', 1)
                    client = gcs.Client()
                    bucket = client.get_bucket(bkt)

                    blob = bucket.get_blob(path)
                    self.schema = json.loads(blob.download_as_string())
                else:
                    with open(bq_schema_filename, 'r') as json_file:
                        self.schema = json.load(json_file)
            except ValueError as e:
                logging.error("Not a valid json file! \n %s", e)
            except AttributeError:
                logging.error("Could not find gcs file %s", bq_schema_filename)
        elif input_bq_table:
            bq_cli = bq.Client()

            dataset_name, table_name = input_bq_table.split('.')
            bq_dataset = bq_cli.dataset(dataset_name)
            bq_table_ref = bq_dataset.table(table_name)  # This forms a TableReference object.
            bq_table = bq_cli.get_table(bq_table_ref)    # Errors out if table doesn't exist.

            # Quickly parse TableSchema object to list of dictionaries.
            self.schema = [
                {'name': field.name,
                 'type': field.field_type,
                 'mode': field.mode
                }
                for field in bq_table.schema
            ]
        else:
            raise AttributeError("DataGenerator requires bq_schema_filename or input_bq_table, "
                                 "neither specified.")
        self.null_prob = float(p_null)
        self.n_keys = int(n_keys)
        self.min_date = min_date
        self.max_date = max_date
        self.only_pos = bool(only_pos)
        self.max_int = int(max_int)
        self.max_float = float(max_float)
        self.float_precision = int(float_precision)

        # Map the passed string representation of the desired disposition.
        # This will force early error if invalid write disposition.
        write_disp_map = {
            'WRITE_APPEND': beam.io.BigQueryDisposition.WRITE_APPEND,
            'WRITE_EMPTY': beam.io.BigQueryDisposition.WRITE_EMPTY,
            'WRITE_TRUNCATE': beam.io.BigQueryDisposition.WRITE_TRUNCATE,
        }

        self.write_disp = write_disp_map[write_disp]

    def get_bq_schema_string(self):
        """Generates a 'FIELDNAME:DATATYPE' string for the BQ api."""
        return ','.join([':'.join([o['name'], o['type']]) for o in self.schema])

    def get_faker_schema(self):
        """
        This function casts the BigQuery schema to one that will be understood by Faker.

        Returns:
            faker_schema: A dictionary mapping field names to Faker providers.
        """

        faker_schema = {}
        for obj in self.schema:
            is_special = False
            for key in _SPECIAL_MAP:
                if key.lower() in obj['name'].lower():
                    faker_schema[obj['name']] = _SPECIAL_MAP[key]
                    is_special = True
                    break
            if not is_special:
                faker_schema[obj['name']] = _TYPE_MAP[obj['type']]

        return faker_schema


class FakeRowGen(beam.DoFn):
    """
    This class wraps the logic defined in DataGenerator object and generates a fake record for each
    element it is passed.
    """
    def __init__(self, data_gen):
        """
        This initiates some properties of the FakeRowGen DoFn including an instance of the
        DataGenerator class and the number of records should be generated for each element in the
        prior PCollection.

        Args:
            data_gen: A DataGenerator object defining the shape of the data should be generated by
                      this DoFn.
        """
        self.data_gen = data_gen

    def get_field_dict(self, field_name):
        """Helper function to get a single field dictionary from the schema for checking type and
        mode."""
        if field_name not in [x['name'] for x in self.data_gen.schema]:
            raise AttributeError('No field with name == %s in self.data_gen.schema' % field_name)
        return [x for x in self.data_gen.schema if x['name'] == field_name][0]

    def sanity_check(self, record, fieldname):
        """
        This function ensures that the data is all of types that BigQuery expects.

        Args:
            record: A dictionary generated by faker_schema representing the candidate for a fake
                    row in our BigQuery table
            fieldname: name of field we are checking with this call.
        """
        # Create a Faker instance for individual parameterized random generation
        # (ie. minimum date).
        faker = Faker()

        field = self.get_field_dict(fieldname)
        # Below handles if the datatype got changed by the faker provider
        if field['type'] == 'STRING' or 'TIME' in field['type'] > -1:
            record[fieldname] = unicode(record[fieldname])
        elif field['type'].find('DATE') > -1:
            # This implements the minimum/maximum date functionality
            # and avoids regenerating a random date if already obeys min/max date.
            if (record[fieldname] < self.data_gen.min_date
                    or record[fieldname] > self.data_gen.max_date):
                record[fieldname] = faker.date_between(self.data_gen.min_date,
                                                       self.data_gen.max_date)
            record[fieldname] = unicode(record[fieldname].strftime('%Y-%m-%d'))
        elif field['type'] == 'INTEGER':
            # This implements max and sign constraints
            # and avoids regenerating a random integer if already obeys min/max integer.
            if record[fieldname] > self.data_gen.max_int:
                record[fieldname] = np.random.randint(0 if self.data_gen.only_pos
                                                      else -1 * self.data_gen.max_int,
                                                      self.data_gen.max_int)
            if self.data_gen.only_pos and record[fieldname] < 0:
                record[fieldname] = abs(record[fieldname])
            record[fieldname] = int(record[fieldname])
        elif field['type'] == 'FLOAT':
            # This implements max and sign constraints
            if (record[fieldname] > self.data_gen.max_float or
                    (record[fieldname] < 0 and self.data_gen.only_pos)):
                record[fieldname] = faker.pyfloat(math.log10(self.data_gen.max_float),
                                                  self.data_gen.float_precision,
                                                  self.data_gen.only_pos)
            record[fieldname] = round(float(record[fieldname]), self.data_gen.float_precision)

        # Make some values null based on null_prob.
        if field['mode'] == 'NULLABLE':
            record[fieldname] = np.random.choice([None, record[fieldname]],
                                                 p=[self.data_gen.null_prob,
                                                    1.0 - self.data_gen.null_prob])

        # Pick key at random from foreign keys.
        # Draw key column from [0, n_keys) if has _key in the name.
        # This forces key column to no contain nulls
        if '_key' in field['name'].lower() or '_id' in field['name'].lower():
            key_mag = int(math.log10(self.data_gen.n_keys))
            # Assume the key field is of string type and format it to be left zero padded.
            record[fieldname] = 'L-' + format(np.random.randint(0, self.data_gen.n_keys),
                                       '0%dd' % (key_mag + 1))
        return record

    def generate_fake(self, fschema):
        """
        This method creates a single fake record based on the constraints defined int
        the FakeRowGen instance's data_gen attribute.

        Args:
                fschema: A dictionary containing a faker_schema (this should be generated by
                         DataGenerator.get_faker_schema() )
        """
        # Initialize a FakerSchema object.
        schema_faker = FakerSchema()

        # Generate a fake record.
        data = schema_faker.generate_fake(fschema, 1)  # Generate one record.

        # This performs a sanity check on datatypes and parameterized constraints.
        for col_name in data:
            data = self.sanity_check(data, col_name)

        return data

    def process(self, element, *args, **kwargs):
        """This function creates n random data records based on the properties
        of the passed DataGenerator object for each element in prior the PCollection.

        Args:
            element: A single element of the PCollection (the contents of this element are ignored
                     in this particularDoFn so we just pass it newlines).
        """

        faker_schema = self.data_gen.get_faker_schema()
        # PCollection returned by DoFn.process() must be an iterable.
        return [self.generate_fake(faker_schema)]


def parse_data_generator_args(argv):
    """ This function parses and implements the defaults for the known arguments needed to
    instantiate the DataGenerator class from the command line arguments and separates them
    from the command line arguments related to the Beam pipeline.
    Args:
        argv: The commandline arguments for this call of this script.
    """
    parser = argparse.ArgumentParser()

    parser.add_argument('--schema_file', dest='schema_file', required=False,
                        help='Schema json file to read. This can be a local file or a file in a '
                         'Google Storage Bucket.')

    parser.add_argument('--input_bq_table', dest='input_bq_table', required=False,
                        help='Name of BigQuery table to populate.')

    parser.add_argument('--output_bq_table', dest='output_bq_table', required=False,
                        help='Name of the table to write to BigQuery table.')

    parser.add_argument('--num_records', dest='num_records', required=False,
                        help='Number of random output records to write to BigQuery table.',
                        default=10)

    parser.add_argument('--p_null', dest='p_null', required=False,
                        help='Probability a nullable column is null.',
                        default=0.2)

    parser.add_argument('--n_keys', dest='n_keys', required=False,
                        help='Cardinality of key columns.',
                        default=1000)

    parser.add_argument('--min_date', dest='min_date', required=False,
                        help='Set earliest possible date for the history represented by this table,'
                        ' %Y-%m-%d format.',
                        default=datetime.date(2018, 1, 1).strftime('%Y-%m-%d'))

    parser.add_argument('--max_date', dest='max_date', required=False,
                        help='Set latest possible date for the history represented by this table '
                        '%Y-%m-%d format.',
                        default=datetime.date.today().strftime('%Y-%m-%d'))

    parser.add_argument('--strictly_positive', dest='only_pos', required=False,
                        help='Dictates if numbers (integers or floats) generated be '
                        'strictly positive.',
                        default=True)

    parser.add_argument('--max_int', dest='max_int', required=False,
                        help='Maximum integer.',
                        default=10 ** 11)

    parser.add_argument('--max_float', dest='max_float', required=False,
                        help='Maximum float.',
                        default=float(10 ** 11))

    parser.add_argument('--float_precision', dest='float_precision', required=False,
                        help='How many digits to the right of the decimal for floats.',
                        default=2)

    parser.add_argument('--write_disposition', dest='write_disp', required=False,
                        help='WriteDisposition for BigQuery. Options are WRITE_APPEND, WRITE_EMPTY '
                             'WRITE_TRUNCATE.',
                        default='WRITE_APPEND')

    return parser.parse_known_args(argv)


def fetch_schema(data_args, schema_inferred):
    """This function either sets the default schema_file property of data_args
    or gets the schema property data args from the input_bq_table
    Args:
        data_args: A namespace containing the known command line arguments parsed by
                   parse_data_generator_args.
        schema_inferred: A boolean capturing if the schema has been inferred from input_bq_table.
    """
    if not data_args.schema_file:
        if not data_args.input_bq_table:
            # Both schema and input_bq_table are unset.
            # Use gcs schema file because safer than assuming this user has created the lineorders
            # table.
            data_args.schema_file = 'gs://python-dataflow-example/schemas/lineorder-schema.json'
        else:
            # Need to fetch schema from existing BQ table.
            bq_cli = bq.Client()
            dataset_name, table_name = data_args.input_bq_table.split('.', 1)
            bq_dataset = bq_cli.dataset(dataset_name)
            bq_table_ref = bq_dataset.table(table_name)  # This forms a TableReference object.
            bq_table = bq_cli.get_table(bq_table_ref)    # Errors out if table doesn't exist.

            # Quickly parse TableSchema object to list of dictionaries.
            data_args.schema = [
                {'name': field.name,
                 'type': field.field_type,
                 'mode': field.mode
                 }
                for field in bq_table.schema
            ]
            if not data_args.output_bq_table:
                # This writes data in place when passed just an input_bq_table
                schema_inferred = True
                data_args.output_bq_table = str(data_args.input_bq_table)
            else:
                # We need to check if this output table already exists.
                dataset_name, table_name = data_args.output_bq_table.split('.', 1)
                bq_dataset = bq_cli.dataset(dataset_name)
                bq_table_ref = bq_dataset.table(table_name)  # This forms a TableReference object.
                try:
                    bq_cli.get_table(bq_table_ref)
                    schema_inferred = True
                except NotFound:
                    schema_inferred = False
    elif not data_args.output_bq_table:
        logging.error('Error: User specified a schema_file without an output_bq_table.')

    if data_args.schema_file and data_args.input_bq_table:
        logging.error('Error: pipeline was passed both schema_file and input_bq_table. \
                      Please enter only one of these arguments')
    return data_args, schema_inferred


def write_n_line_file_to_gcs(project, temp_location, n):
    """Write an n-line file to the temp_location in Google Cloud Storage.
    Args:
        temp_location: A string specifying a GCS location to write to.
        n: An integer specifying the number of lines to write to a file.
    """
    # Prepare to write gcs file 'temp_num_records.txt' in the temp_location.
    bucket_name, path = temp_location.strip('gs://').split('/', 1)

    gcs_client = gcs.Client(project=project)
    temp_bucket = gcs_client.get_bucket(bucket_name)
    temp_blob = gcs.Blob(path + '/temp_num_records.txt', temp_bucket)

    # Write num_records newlines to a file_string. These will be our initial PCollection elements.
    # This method was chosen because it proved more performant than beam.Create for a large initial
    # PColleciton and to take advantage of distributed read from GCS.
    file_string = '\n' * int(n)
    temp_blob.upload_from_string(file_string)
    return temp_blob


def data_generator_from_data_args(data_args):
    """Helper funciton to construct an instance of the DataGenerator class from the parsed command
    line arguments.
    Args:
        data_args: A namespace containing the known command line arguments parsed by
                   parse_data_generator_args.
    """
    # DataGenerator is a class we built in this script to hold the logic for
    # generation of random into a BigQuery table.
    # See the known arguments of our parser defined above, to understand the contents of data_args.
    return DataGenerator(bq_schema_filename=data_args.schema_file,
                         input_bq_table=data_args.input_bq_table, p_null=data_args.p_null,
                         n_keys=data_args.n_keys,
                         min_date=datetime.datetime.strptime(data_args.min_date,'%Y-%m-%d').date(),
                         max_date=datetime.datetime.strptime(data_args.max_date,'%Y-%m-%d').date(),
                         only_pos=data_args.only_pos, max_int=data_args.max_int,
                         max_float=data_args.max_float,
                         float_precision=data_args.float_precision,
                         write_disp=data_args.write_disp)


def run(argv=None):
    """
    This funciton parses the command line arguments and runs the Beam Pipeline.

    Args:
        argv: list containing the commandline arguments for this call of the script.
    """
    schema_inferred = False

    data_args, pipeline_args = parse_data_generator_args(argv)
    data_args, schema_inferred = fetch_schema(data_args, schema_inferred)
    pipeline_options = PipelineOptions(pipeline_args)

    temp_location = pipeline_options.display_data()['temp_location']
    temp_blob = write_n_line_file_to_gcs(pipeline_options.display_data()['project'],temp_location,
                                         data_args.num_records)

    data_gen = data_generator_from_data_args(data_args)
    # Initiate the pipeline using the pipeline arguments passed in from the
    # command line.  This includes information including where Dataflow should
    # store temp files, and what the project id is and what runner to use.
    p = beam.Pipeline(options=pipeline_options)

    (p

     # Read the file we created with num_records newlines.

     | 'Read file with num_records lines' >> beam.io.ReadFromText(temp_location +
                                                                  '/temp_num_records.txt')
     # Use our instance of our custom DataGenerator Class to generate 1 fake datum
     # with the appropriate schema for each element in the PColleciton created above.
     | 'Generate Data' >> beam.ParDo(FakeRowGen(data_gen))
     | 'Write to BigQuery' >> beam.io.gcp.bigquery.WriteToBigQuery(
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

    # Manually clean up of temp_num_records.txt because it will be outside this job's
    # directory and Dataflow will not remove it for us.
    temp_blob.delete()


if __name__ == '__main__':
    logging.getLogger().setLevel(logging.INFO)
    run()
