# Copyright 2019 Google Inc.
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

import argparse
import datetime
import json
import logging
import math
import numpy as np
import random
import re
import string
from uuid import uuid4

import apache_beam as beam
import apache_beam.io.gcp.bigquery as beam_bigquery
from faker import Faker
from faker_schema.faker_schema import FakerSchema
from google.cloud import bigquery as bq
from google.cloud import storage as gcs
from scipy.stats import truncnorm
from google.cloud.exceptions import NotFound
import sys


class DataGenerator(object):
    """
    A class which contains the logic for data generation.

    Attributes:
        bq_schema_filename (str): A path to a local or gcs file containing a
            BigQuery schema in a json file.
        null_prob (float): The desired sparsity of the generated data.
        n_keys (int): The cardinality of foreign key columns (for generating
            joinable schemas).
        min_date (datetime.date): The earliest date to generate.
        max_date (datetime.date): The latest date to generate.
        only_pos (bool): Specifies whether to allow negative numbers to be
            generated.
        max_int (int): The upper bound for the range of integers
            to generate.
        max_float (float): The upper bound for the range of floats to
            generate.
        float_precision (int): The desired display precision for generated
            floats. (Note that BigQuery will cast all floats with double
            precision on the backend).
        primary_key_cols (str): The primary key for the generated data.
        dest_joining_key_col (str): The name of the key column in the table
            we are generating that joins to source_joining_key_col.

    """
    def __init__(self,
                 bq_schema_filename=None,
                 input_bq_table=None,
                 hist_bq_table=None,
                 p_null=0.1,
                 n_keys=sys.maxsize,
                 min_date='2000-01-01',
                 max_date=datetime.date.today().strftime('%Y-%m-%d'),
                 only_pos=True,
                 max_int=10**11,
                 max_float=float(10**11),
                 float_precision=2,
                 write_disp='WRITE_APPEND',
                 key_skew='None',
                 primary_key_cols=None,
                 dest_joining_key_col=None,
                 bq_cli=None):
        """
        Args:
        bq_schema_filename (str): A path to a local or gcs file containing a
            BigQuery schema in a json file.
        p_null (float): The desired sparsity of the generated data.
        n_keys (int): The cardinality of foreign key columns (for generating
            joinable schemas).
        min_date (datetime.date): The earliest date to generate.
        max_date (datetime.date): The latest date to generate.
        only_pos (bool): Specifies whether to allow negative numbers to be
            generated.
        max_int (int): The upper bound for the range of integers
            to generate.
        max_float (float): The upper bound for the range of floats to
            generate.
        float_precision (int): The desired display precision for generated
            floats. (Note that BigQuery will cast all floats with double
            precision on the backend).
        primary_key_cols (str): The primary key for the generated data.
        dest_joining_key_col (str): The name of the key column in the table
            we are generating that joins to source_joining_key_col.
        """
        if not bq_cli:
            bq_cli = bq.Client()
        if bq_schema_filename is not None:
            try:
                # Handles json from google cloud storage or local.
                if bq_schema_filename.find('gs://') == 0:
                    bkt, path = bq_schema_filename.strip('gs://').split('/', 1)
                    client = gcs.Client()
                    bucket = client.get_bucket(bkt)

                    blob = bucket.get_blob(path)
                    self.schema = json.loads(blob.download_as_string())
                else:
                    with open(bq_schema_filename, 'r') as json_file:
                        self.schema = json.load(json_file)
            except ValueError:
                logging.error("Not a valid json file! \n %s", str(ValueError))
            except AttributeError:
                logging.error("Could not find gcs file %s",
                              str(bq_schema_filename))
        elif input_bq_table:

            dataset_name, table_name = input_bq_table.split('.')
            bq_dataset = bq_cli.dataset(dataset_name)
            # This forms a TableReference object.
            bq_table_ref = bq_dataset.table(table_name)
            # Errors out if table doesn't exist.
            bq_table = bq_cli.get_table(bq_table_ref)

            # Quickly parse TableSchema object to list of dictionaries.
            self.schema = {
                'fields': [{
                    'name': field.name,
                    'type': field.field_type,
                    'mode': field.mode
                } for field in bq_table.schema]
            }
        if hist_bq_table:
            dataset_name, table_name = hist_bq_table.split('.')
            bq_dataset = bq_cli.dataset(dataset_name)
            # This forms a TableReference object.
            bq_table_ref = bq_dataset.table(table_name)
            # Errors out if table doesn't exist.
            bq_table = bq_cli.get_table(bq_table_ref)

            self.hist_bq_table = hist_bq_table
        else:
            self.hist_bq_table = None

        self.null_prob = float(p_null)
        self.n_keys = int(n_keys)
        self.min_date = datetime.datetime.strptime(min_date, "%Y-%m-%d").date()
        self.max_date = datetime.datetime.strptime(max_date, "%Y-%m-%d").date()
        self.only_pos = bool(only_pos)
        self.max_int = int(max_int)
        self.min_int = 0 if self.only_pos else -1 * self.max_int
        self.max_float = float(max_float)
        self.min_float = 0.0 if self.only_pos else -1.0 * self.max_float
        self.float_precision = int(float_precision)
        self.key_skew = key_skew
        self.dest_joining_key_col = dest_joining_key_col
        # Map the passed string representation of the desired disposition.
        # This will force early error if invalid write disposition.
        write_disp_map = {
            'WRITE_APPEND': beam.io.BigQueryDisposition.WRITE_APPEND,
            'WRITE_EMPTY': beam.io.BigQueryDisposition.WRITE_EMPTY,
            'WRITE_TRUNCATE': beam.io.BigQueryDisposition.WRITE_TRUNCATE
        }

        self.write_disp = write_disp_map[write_disp]

    def get_bq_schema(self):
        """
        This helper function parses a 'FIELDNAME:DATATYPE' string for the BQ
        api.
        """
        return beam_bigquery.parse_table_schema_from_json(
            json.dumps(self.schema))

    def get_faker_schema(self, fields=None):
        """
        This function casts the BigQuery schema to one that will be understood
        by Faker.
        Args:
            fields: (dict) When using this method to get the faker schema for
                a STRUCT / RECORD type field this will keyword parameter will
                serve as the schema.

        Returns:
            faker_schema: A dictionary mapping field names to Faker providers.
        """
        # Parse faker_schema out of the DataGenerator object's schema.
        type_map = {
            'ARRAY': 'pylist',
            'BOOLEAN': 'boolean',
            'BYTES': 'pystr',
            'DATE': 'date_this_century',
            'DATETIME': 'date_time_this_century',
            'FLOAT': 'pyfloat',
            'INTEGER': 'random_number',
            'NUMERIC': 'pyfloat',
            'RECORD': 'pystruct',
            'STRING': 'word',
            'TIME': 'time',
            'TIMESTAMP': 'date_time_this_century'
        }

        # Use more specific Faker providers by looking for these keys as a
        # substring of the field name in the schema.
        # (See documention at
        #  https://faker.readthedocs.io/en/latest/providers.html ).
        special_map = {
            'address': 'street_address',  # Street Address
            'ean': 'ean13',  # European Access Number
            'sku': 'ean8',  # Not a sku but serves same purpose.
            'file': 'file_name',  # name.extension
            'isbn': 'isbn13',
            'color': 'color_name',
            'zip': 'zipcode',
            'phone': 'phone_number',
            'name': 'name',  # Human name
            'company': 'company',
            'manufacturer': 'company',
            'supplier': 'company',
            'distibuter': 'company',
            'provider': 'company',
            'model': 'iban',
            'month': 'month',
            'city': 'city',
            'state': 'state',
            'country': 'country',
            'nation': 'country',
            'license': 'license_plate',
            'card_number': 'credit_card_number',
            'card_provider': 'credit_card_provider',
            'credit_card_full': 'credit_card_full',
            'expiration': 'credit_card_expire',
            'ssn': 'ssn',
            'social_security_number': 'ssn',
            'username': 'user_name',
            'url': 'uri',
            'uri': 'uri',
            'email': 'email',
            'num': 'random_number',
            'description': 'paragraph'
        }

        faker_schema = {}
        this_call_schema = fields if fields else self.schema['fields']
        for obj in this_call_schema:
            is_special = False
            if obj['type'].lower() == 'record':
                # recursively call to capture nested structure.
                faker_schema[obj['name']] = self.get_faker_schema(
                    fields=obj['fields'])
            else:
                for key in special_map:
                    if key.lower() in obj['name'].lower():
                        faker_schema[obj['name']] = \
                                special_map[key]
                        is_special = True
                        break
                if not is_special:
                    faker_schema[obj['name']] = \
                            type_map[obj['type']]
        return faker_schema

    def enforce_joinable_keys(self, record, key_set=None):
        """
        This function will accept key_set as a side input containing the set of
        key values for the key_col in record.
        Args:
            record: (dict) A single generated record.
            key_col: (str) The foreign key column in record.
            key_set: (apache_beam.pvalue.AsList) side input from the BigQuery
                query against the fact table.
        Returns:
            record (dict) The record mutated to have keys in key_col that join
                to the fact table.
        """
        record[self.dest_joining_key_col] = np.random.choice(key_set)
        return [record]


class FakeRowGen(beam.DoFn):
    """
    This class wraps the logic defined in DataGenerator object and generates a
    fake record for each element it is passed.
    """
    def __init__(self, data_gen):
        """
        This initiates some properties of the FakeRowGen DoFn including an
        instance of the DataGenerator class and the number of records should be
        generated for each element in the prior PCollection.

        Attributes:
            data_gen(DataGenerator): defines the shape of the data should be
            generated by this DoFn.
        """
        self.data_gen = data_gen

    # Helper function to get a single field dictionary from the schema for
    # checking type and mode.

    def get_field_dict(self, field_name, fields=None):
        this_call_schema = fields if fields else self.data_gen.schema['fields']
        return [f for f in this_call_schema if f['name'] == field_name][0]

    def get_percent_between_min_and_max_date(self, date_string):
        """
        This is a function to see where in your date this record is so you can
        add time trends to your random data. It is used in sanity check to make
        numeric columns pu

        """
        if date_string is None:
            return 0.5

        try:
            d = datetime.datetime.strptime(date_string, '%Y-%m-%d')
        except:
            d = datetime.datetime.strptime(date_string, '%Y-%m-%dT%H:%M:%S')

        max_date_days_since_bce = (self.data_gen.max_date.timetuple().tm_yday +
                                   (self.data_gen.max_date.year * 365))
        min_date_days_since_bce = (self.data_gen.min_date.timetuple().tm_yday +
                                   (self.data_gen.min_date.year * 365))
        total_date_range = max_date_days_since_bce - min_date_days_since_bce
        date_days_since_bce = d.timetuple().tm_yday + (d.year * 365)

        return (date_days_since_bce - min_date_days_since_bce) / \
            float(total_date_range)

    def sanity_check(self,
                     record,
                     fieldname,
                     random_number,
                     fields=None,
                     dest_joining_key_col=None):
        """
        This function ensures that the data is all of types that BigQuery
        expects. Certain Faker providers do not return the data type we desire.

        Args:
            record (dict): Generated by faker_schema, this represents the
                candidate for a fake row in our BigQuery table
            fieldname (str): name of field we are checking with this call.
        """
        # Create a Faker instance for individual parameterized random generation
        # (ie. minimum date).
        field = self.get_field_dict(fieldname, fields=fields)

        # Below handles if the datatype got changed by the faker provider

        if field['type'] == 'RECORD':
            # We will fill each array of struct with 0-3 elements.
            array_of_struct = []
            record[fieldname] = []
            for i in range(random.randint(0, 3)):
                nested_record = {}
                for col in field['fields']:
                    # Recursively sanity check the next level.
                    nested_record = self.sanity_check(nested_record,
                                                      col['name'],
                                                      random_number,
                                                      fields=field['fields'])
                array_of_struct.append(nested_record)
            record[fieldname] = array_of_struct
        elif field['type'] == 'STRING':
            # Efficiently generate random string.
            STRING_LENGTH = 36

            # If the description of the field is a RDMS schema like VARCHAR(255)
            # then we extract this number and generate a string of this length.
            if field.get('description'):
                extracted_numbers = re.findall('\d+', field['description'])
                if extracted_numbers:
                    STRING_LENGTH = int(extracted_numbers[0])

            char_idxs = np.random.randint(0,
                                          len(string.ascii_letters),
                                          size=STRING_LENGTH)
            record[fieldname] = str(''.join(string.ascii_letters[i]
                                            for i in char_idxs))

        elif field['type'] == 'TIMESTAMP':
            pct = random_number / float(sys.maxsize)
            SECONDS_IN_A_DAY = 24 * 60 * 60
            start = self.data_gen.min_date
            max_delta = self.data_gen.max_date - self.data_gen.min_date
            delta = pct * max_delta.total_seconds()

            record[fieldname] = self.data_gen.min_date \
                                + datetime.timedelta(seconds=delta)
            record[fieldname] = str(
                record[fieldname].strftime('%Y-%m-%dT%H:%M:%S'))

        elif field['type'] == 'DATETIME':
            pct = random_number / float(sys.maxsize)
            SECONDS_IN_A_DAY = 24 * 60 * 60
            start = self.data_gen.min_date
            max_delta = self.data_gen.max_date - self.data_gen.min_date
            delta = pct * max_delta.total_seconds()

            record[fieldname] = start + datetime.timedelta(seconds=delta)
            record[fieldname] = str(
                record[fieldname].strftime('%Y-%m-%dT%H:%M:%S'))

        elif field['type'] == 'DATE':
            # This implements the minimum/maximum date functionality
            # and avoids regenerating a random date if already obeys min/max
            # date.
            pct = random_number / float(sys.maxsize)
            start = self.data_gen.min_date
            max_delta = self.data_gen.max_date - self.data_gen.min_date
            delta = int(pct * max_delta.days)

            record[fieldname] = start + datetime.timedelta(days=delta)
            record[fieldname] = str(record[fieldname].strftime('%Y-%m-%d'))

        elif field['type'] == 'INTEGER':
            max_size = self.data_gen.max_int
            record[fieldname] = int(max_size * (random_number / sys.maxsize))

            if '_max_' in field['name'].lower():
                max_size = int(fieldname[fieldname.find("_max_") +
                                         5:len(fieldname)])
            # This implements max and sign constraints
            # and avoids regenerating a random integer if already obeys min/max
            # integer.
            record[fieldname] = min(int(record[fieldname]), max_size)
            if self.data_gen.only_pos:
                record[fieldname] = abs(record[fieldname])

        elif field['type'] == 'FLOAT' or field['type'] == 'NUMERIC':
            min_size = float(self.data_gen.min_float)
            max_size = float(self.data_gen.max_float)

            if '_max_' in field['name'].lower():
                max_size = float(fieldname[fieldname.find("_max_") +
                                           5:len(fieldname)])
            record[fieldname] = max_size * random_number / float(sys.maxsize)

            record[fieldname] = round(float(record[fieldname]),
                                      self.data_gen.float_precision)
            if self.data_gen.only_pos:
                record[fieldname] = abs(record[fieldname])

        # Make some values null based on null_prob.
        if field.get('mode') == 'NULLABLE':
            record[fieldname] = np.random.choice(
                [None, record[fieldname]],
                p=[self.data_gen.null_prob, 1.0 - self.data_gen.null_prob])

        # Pick key at random from foreign keys.
        # Draw key column from [0, n_keys) if has _key in the name.
        # This forces key column to no contain nulls
        if '_key' in field['name'].lower() or '_id' in field['name'].lower():
            key = self.get_skewed_key(self.data_gen.key_skew)
            record[fieldname] = key

            if field['type'] == "STRING":
                # Assume the key field is of string type.
                record[fieldname] = str(key)

        # Return a tuple of the current timestamp and this fake record.
        return record

    def trunc_norm_trendify(self, loc, var_scale=0.1):
        """
        This function is used to draw a sample from a bounded linear trend with
        some noise.
        Y = (min - max)* loc + min + noise
        The user can control the expectation and variance of the values
        provided by this function. Note the upper and lower bounds come from the
        data_gen object.

        Args:
            loc (float): This controls the expectation of the produced variate.
                This should specify the percentage of the way between the
                [min, max] range to center values.
            var_scale (float): This controls the variance of teh produced
                variate. This should b
        """
        loc = min(max(loc, 0.0), 1.0)
        var_scale = min(max(var_scale, 0.0), 1.0)

        lower_bound = self.data_gen.min_float
        upper_bound = self.data_gen.max_float
        mu = loc * (upper_bound - lower_bound) + lower_bound
        sigma = var_scale * (upper_bound - lower_bound)
        a, b = (lower_bound - mu) / sigma, (upper_bound - mu) / sigma
        return truncnorm.rvs(a, b, mu, sigma)

    def get_skewed_key(self, distribution=None):
        if distribution is None or distribution == 'None':
            distribution = 'uniform'
        if distribution.lower() == 'binomial':
            return np.random.binomial(int(self.data_gen.n_keys), p=.5)
        elif distribution.lower() == 'zipf':
            key = np.random.zipf(1.25)
            while key > self.data_gen.n_keys:
                key = np.random.zipf(1.25, 1)
            return int(key)
        elif distribution.lower() == 'uniform':
            return int(np.random.randint(1, self.data_gen.n_keys))

    def convert_key_types(self, keys):
        """
        This method provides the logic for taking the fingerprint hash
        and converting it back to a datatype that matches the schema.
        """
        for key in keys:
            if key == 'frequency':
                pass
            else:
                field_dict = self.get_field_dict(key)
                datatype = field_dict['type']
                if datatype == 'STRING':
                    keys[key] = str(keys[key])
                elif datatype == 'INTEGER':
                    pass
                elif datatype == 'BYTES':
                    keys[key] = bytes(keys[key])
                #TODO add other datatypes as needed by your usecase.
        return keys

    def generate_fake(self, fschema, key_dict=None):
        """
        This method creates a single fake record based on the constraints
        defined in this FakeRowGen instance's data_gen attribute.

        Arguments:
                fschema (dict): Contains a faker_schema (this should be
                    generated by DataGenerator.get_faker_schema() )
        """

        # Drop the key columns because we do not need to randomly generate them.
        if key_dict:
            for key in list(key_dict.keys()):
                fschema.pop(key, None)

        # Random numbers which will be converted to the proper datatype later by
        # sanity_check.
        # We pregenerate this way for efficiency. Sanity check will not just peform
        # deterministic actions.
        random_numbers = np.random.randint(0, sys.maxsize, size=len(fschema))

        # Generate a fake record.
        col_idx = 0
        data = {}
        for col_name in list(fschema.keys()):
            data = self.sanity_check(data, col_name, random_numbers[col_idx])
            col_idx += 1

        if key_dict:
            keys = self.convert_key_types(key_dict)
            # Join the keys and the rest of the genreated data
            data.update(keys)
            data.pop('frequency')
        return json.dumps(data)

    def process(self, element, *args, **kwargs):
        """This function creates a random record based on the properties
        of the passed DataGenerator object for each element in prior the
        PCollection.

        Args:
            element: A single element of the PCollection
        """

        faker_schema = self.data_gen.get_faker_schema()
        try:
            # Here the element is treated as the dictionary representing a single row
            # of the histogram table.
            frequency = int(element.get('frequency'))

            for i in range(frequency):
                row = self.generate_fake(fschema=faker_schema,
                                         key_dict=element)
                yield row
        except AttributeError:
            # The contents of this element are ignored if they are a string.
            row = self.generate_fake(fschema=faker_schema, key_dict=element)
            yield row


def parse_data_generator_args(argv):
    """ This function parses and implements the defaults for the known arguments
    needed to instantiate the DataGenerator class from the command line
    arguments and separates them from the command line arguments related to the
    Beam pipeline.
    Args:
        argv: The commandline arguments for this call of this script.
    """
    parser = argparse.ArgumentParser()

    parser.add_argument('--schema_file',
                        dest='schema_file',
                        required=False,
                        help='Schema json file to read. This can be a local '
                        'file or a file in a Google Storage Bucket.')

    parser.add_argument('--input_bq_table',
                        dest='input_bq_table',
                        required=False,
                        help='Name of BigQuery table to populate.')

    parser.add_argument('--output_bq_table',
                        dest='output_bq_table',
                        required=False,
                        help='Name of the table to write to BigQuery table.')

    parser.add_argument('--hist_bq_table',
                        dest='hist_bq_table',
                        required=False,
                        help='Name of BigQuery table to populate.')

    parser.add_argument('--num_records',
                        dest='num_records',
                        required=False,
                        help='Number of random output records to write to '
                        'BigQuery table.',
                        default=10)

    parser.add_argument('--primary_key_cols',
                        dest='primary_key_cols',
                        required=False,
                        help='Field name of primary key. ',
                        default=None)

    parser.add_argument('--p_null',
                        dest='p_null',
                        required=False,
                        help='Probability a nullable column is null.',
                        default=0.0)

    parser.add_argument('--n_keys',
                        dest='n_keys',
                        required=False,
                        help='Cardinality of key columns.',
                        default=sys.maxsize)

    parser.add_argument('--key_skew_distribution',
                        dest='key_skew',
                        required=False,
                        help='The distribution of keys.  By default this is '
                        'None, meaning roughly equal distribution'
                        'of rowcount across keys.  '
                        'This also supports "binomial" giving a maximum '
                        'variance bell curve of keys over the range of the'
                        ' keyset or "zipf" giving a distribution across '
                        'the keyset according to zipf\'s law',
                        default=None)

    parser.add_argument('--min_date',
                        dest='min_date',
                        required=False,
                        help='Set earliest possible date for the history '
                        'represented by this table,'
                        ' %Y-%m-%d format.',
                        default=datetime.date(2018, 1, 1).strftime('%Y-%m-%d'))

    parser.add_argument('--max_date',
                        dest='max_date',
                        required=False,
                        help='Set latest possible date for the history '
                        'represented by this table '
                        '%Y-%m-%d format.',
                        default=datetime.date.today().strftime('%Y-%m-%d'))

    parser.add_argument('--strictly_positive',
                        dest='only_pos',
                        required=False,
                        help='Dictates if numbers (integers or floats) '
                        'generated be strictly positive.',
                        default=True)

    parser.add_argument('--max_int',
                        dest='max_int',
                        required=False,
                        help='Maximum integer.',
                        default=10**11)

    parser.add_argument('--max_float',
                        dest='max_float',
                        required=False,
                        help='Maximum float.',
                        default=float(10**11))

    parser.add_argument('--float_precision',
                        dest='float_precision',
                        required=False,
                        help='How many digits to the right of the decimal for '
                        'floats.',
                        default=2)

    parser.add_argument('--fact_table',
                        dest='fact_table',
                        help='Side input table to select key set from when '
                        'generating joinable schemas.',
                        default=None)

    parser.add_argument('--source_joining_key_col',
                        dest='source_joining_key_col',
                        help='Column in fact_table containing foreign key for '
                        'this dimension table.',
                        default=None)

    parser.add_argument('--dest_joining_key_col',
                        dest='dest_joining_key_col',
                        help='Column in fact_table containing foreign key for '
                        'this dimension table.',
                        default=None)

    parser.add_argument(
        '--csv_schema_order',
        dest='csv_schema_order',
        help='This is a comma separated list of the order in which'
        'to write data to csv.',
        default=None)

    parser.add_argument('--avro_schema_file',
                        dest='avro_schema_file',
                        help='This is an avro schema file to use for writing'
                        'data to avro on gcs.',
                        default=None)

    parser.add_argument('--gcs_output_prefix',
                        dest='output_prefix',
                        help='GCS path for output',
                        default=None)

    parser.add_argument('--write_disp',
                        dest='write_disp',
                        required=False,
                        help='BigQuery Write Disposition.',
                        default='WRITE_APPEND')

    return parser.parse_known_args(argv)


def validate_data_args(data_args):
    """
    This function serves to check that none of the pipeline parameters conflict.
    """
    if data_args.schema_file is None:
        if data_args.input_bq_table is None:
            # Both schema and input_bq_table are unset.
            # Use gcs schema file because safer than assuming this user has
            # created the lineorders table.
            data_args.schema_file = \
                'gs://python-dataflow-example/schemas/lineorder-schema.json'
        else:
            # Need to fetch schema from existing BQ table.
            bq_cli = bq.Client()
            dataset_name, table_name = data_args.input_bq_table.split('.', 1)
            bq_dataset = bq_cli.dataset(dataset_name)
            # This forms a TableReference object.
            bq_table_ref = bq_dataset.table(table_name)
            # Errors out if table doesn't exist.
            bq_table = bq_cli.get_table(bq_table_ref)

            # Quickly parse TableSchema object to list of dictionaries.
            data_args.schema = [{
                'name': field.name,
                'type': field.field_type,
                'mode': field.mode
            } for field in bq_table.schema]

            # Check if there are nested datatypes but CSV output.
            if data_args.csv_schema_order:
                types = [field['type'] for field in data_args.schema]
                if 'RECORD' in types:
                    raise ValueError("Cannot write nested types to CSV.")

            if data_args.output_bq_table:
                # We need to check if this output table already exists.
                dataset_name, table_name = data_args.output_bq_table.split(
                    '.', 1)
                bq_dataset = bq_cli.dataset(dataset_name)
                # This forms a TableReference object.
                bq_table_ref = bq_dataset.table(table_name)
                try:
                    _ = bq_cli.get_table(bq_table_ref)
                    schema_inferred = True
                except NotFound:
                    schema_inferred = False

    if data_args.schema_file and data_args.input_bq_table:
        logging.error('Error: pipeline was passed both schema_file '
                      'and input_bq_table. Please enter only one of these '
                      'arguments.')
        raise ValueError('Error: pipeline was passed both schema_file '
                         'and input_bq_table. Please enter only one of these '
                         'arguments.')


def fetch_schema(data_args, schema_inferred):
    """This function either sets the default schema_file property of data_args
    or gets the schema property data args from the input_bq_table
    Args:
        data_args: A namespace containing the known command line arguments
        parsed by parse_data_generator_args.
        schema_inferred: A boolean capturing if the schema has been inferred
        from input_bq_table.
    """
    if not data_args.schema_file:
        if not data_args.input_bq_table:
            # Both schema and input_bq_table are unset.
            # Use gcs schema file because safer than assuming this user has
            # created the lineorders table.
            data_args.schema_file = \
                'gs://python-dataflow-example/schemas/lineorder-schema.json'
        else:
            # Need to fetch schema from existing BQ table.
            bq_cli = bq.Client()
            dataset_name, table_name = data_args.input_bq_table.split('.', 1)
            bq_dataset = bq_cli.dataset(dataset_name)
            # This forms a TableReference object.
            bq_table_ref = bq_dataset.table(table_name)
            # Errors out if table doesn't exist.
            bq_table = bq_cli.get_table(bq_table_ref)

            # Quickly parse TableSchema object to list of dictionaries.
            data_args.schema = [{
                'name': field.name,
                'type': field.field_type,
                'mode': field.mode,
                'fields': field.fields
            } for field in bq_table.schema]
            if data_args.output_bq_table:
                # We need to check if this output table already exists.
                dataset_name, table_name = data_args.output_bq_table.split(
                    '.', 1)
                bq_dataset = bq_cli.dataset(dataset_name)
                # This forms a TableReference object.
                bq_table_ref = bq_dataset.table(table_name)
                try:
                    bq_cli.get_table(bq_table_ref)
                    schema_inferred = True
                except NotFound:
                    schema_inferred = False

    if data_args.schema_file and data_args.input_bq_table:
        logging.error('Error: pipeline was passed both schema_file and '
                      'input_bq_table. '
                      'Please enter only one of these arguments')
        raise ValueError('Error: pipeline was passed both schema_file and '
                         'input_bq_table. '
                         'Please enter only one of these arguments')

    return data_args, schema_inferred
