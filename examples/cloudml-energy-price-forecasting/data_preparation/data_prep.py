#!/usr/bin/env python
#Copyright 2018 Google LLC
#
#Licensed under the Apache License, Version 2.0 (the "License");
#you may not use this file except in compliance with the License.
#You may obtain a copy of the License at
#
#     http://www.apache.org/licenses/LICENSE-2.0
#
#Unless required by applicable law or agreed to in writing, software
#distributed under the License is distributed on an "AS IS" BASIS,
#WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
#See the License for the specific language governing permissions and
#limitations under the License.
# ==============================================================================
"""Prepares the data for Machine Learning.

  Uses the raw data in BigQuery to create a training, validation and test
  tables. Computes the mean and standard deviation for the weather features and
  saves them for later use by the TensorFlow model.

  Typical usage example:

  python -m data_preparation.data_prep
"""

import argparse
import pickle

from google.cloud import bigquery
import numpy as np
from tensorflow.python.lib.io import file_io

from constants import constants


def initialise_params():
    """Parses all arguments and assigns default values when missing.

    Convert argument strings to objects and assign them as attributes of the
    namespace.

    Returns:
        An object containing all the parsed arguments for script to use.
    """
    args_parser = argparse.ArgumentParser()
    args_parser.add_argument(
        '--dataset',
        help='Dataset name.',
        default='Energy'
    )
    args_parser.add_argument(
        '--train_table',
        help='Name of the output BigQuery table containing training data.',
        default='MLDataTrain'
    )
    args_parser.add_argument(
        '--valid_table',
        help='Name of the output BigQuery table containing validation data.',
        default='MLDataValid'
    )
    args_parser.add_argument(
        '--test_table',
        help='Name of the output BigQuery table containing test data.',
        default='MLDataTest'
    )
    args_parser.add_argument(
        '--prepare_data_file',
        help='Path to prepare_data sql file.',
        default='data_preparation/prepare_data.sql'
    )
    args_parser.add_argument(
        '--weather_mean_std_file',
        help='Path to weather_mean_std sql file.',
        default='data_preparation/weather_mean_std.sql'
    )
    args_parser.add_argument(
        '--train_from_date',
        help='Starting date for training data.',
        default='2015-01-05 00:00:00'
    )
    args_parser.add_argument(
        '--train_to_date',
        help='End date for training data.',
        default='2015-10-04 23:01:00'
    )
    args_parser.add_argument(
        '--valid_from_date',
        help='Starting date for validation data.',
        default='2015-10-05 00:00:00'
    )
    args_parser.add_argument(
        '--valid_to_date',
        help='End date for validation data.',
        default='2015-10-11 23:01:00'
    )
    args_parser.add_argument(
        '--test_from_date',
        help='Starting date for testing data.',
        default='2015-10-12 00:00:00'
    )
    args_parser.add_argument(
        '--test_to_date',
        help='End date for testing data.',
        default='2015-10-18 23:01:00'
    )
    args_parser.add_argument(
        '--price_scaling',
        help='Fraction used to scale energy prices.',
        default=0.01
    )
    args_parser.add_argument(
        '--mean_path',
        help='Output path for feature means.',
        default='gs://energyforecast/data/pickle/mean.pkl'
    )
    args_parser.add_argument(
        '--std_path',
        help='Output path for feature standard deviations.',
        default='gs://energyforecast/data/pickle/std.pkl'
    )
    return args_parser.parse_args()


def run_query(client, query, job_config):
    """Runs specified SQL query in BigQuery.

    Args:
        client: `google.cloud.bigquery.client.Client` instance.
        query: String containing SQL query.
        job_configuration: `QueryJobConfig` instance.

    Returns:
        Result from running the query in BigQuery.
    """
    query_job = client.query(
        query,
        job_config=job_config)
    return query_job.result()


def scalar_extraction_query(inner_query):
    """Generates scalar extraction query.

    Extracts all values from array columns into scalars. Joins the energy hourly
    prices with the weather data, computes the hourly price distributions for
    the previous week, and extracts all scalars from the distribution and
    weather array columns.

    Args:
        inner_query: Query to join energy prices with past price distribution
            and with weather data.

    Returns:
        String with query wrapping the inner_query to extract scalar columns.
    """
    distribution_cols = ['distribution[OFFSET(' +
                         str(i) + ')] distribution' + str(i)
                         for i in range(constants.DISTRIBUTION_SIZE)]
    weather_cols = ['weather[OFFSET(' + str(i) + ')] weather' + str(i)
                    for i in range(constants.WEATHER_SIZE)]

    combined_cols = ', '.join(distribution_cols + weather_cols)

    with_statement = 'WITH Feature_Temp AS (' + inner_query + ')'
    select_statement = 'SELECT price, date_utc, day, hour, ' + combined_cols
    from_statement = 'FROM Feature_Temp'

    query = ' '.join([with_statement, select_statement, from_statement])
    return query


def create_table(
        from_date,
        to_date,
        table_name,
        query_file,
        dataset,
        price_scaling,
        client):
    """Creates training, validation, and test tables.

    Specifies parameters to be passed to the SQL query, specifies name for the
    new table being created, generates a dynamic query and executes the query.

    Args:
        from_date: Intial date for table's data.
        to_date: Final date for table's data.
        table_name: Name for table.
        query_file: Path to file containing the SQL query.
        dataset: `BigQuery` `Dataset` in which to save the table.
        price_scaling: Float used to scale (multiply with) the labels (price)
            for scaling purposes. Given the initialization schemes and
            normalized inputs, the expected values for the outputs will be close
            to 0. This means that by scaling the labels you will not be too far
            off from the start, which helps convergence. If a target is too big,
            the mean squared error will be huge which means your gradients will
            also be huge and could lead to numerical instability.
        client: `google.cloud.bigquery.client.Client` instance.
    """
    query_params = [
        bigquery.ScalarQueryParameter(
            'from_date',
            'STRING',
            from_date),
        bigquery.ScalarQueryParameter(
            'to_date',
            'STRING',
            to_date),
        bigquery.ScalarQueryParameter(
            'price_scaling',
            'FLOAT64',
            price_scaling)]
    table_ref = client.dataset(
        dataset).table(
        table_name)

    job_config = bigquery.QueryJobConfig()
    job_config.query_parameters = query_params
    job_config.destination = table_ref

    with open(query_file, 'r') as myfile:
        inner_query = myfile.read()

    run_query(
        client,
        scalar_extraction_query(inner_query),
        job_config)


def generate_data(client, parameters):
    """Creates training, validation, and test tables for ML model.

    Args:
        client: `google.cloud.bigquery.client.Client` instance.
        parameters: Parameters passed to script.
    """
    create_table(
        parameters.train_from_date,
        parameters.train_to_date,
        parameters.train_table,
        parameters.prepare_data_file,
        parameters.dataset,
        parameters.price_scaling,
        client)

    create_table(
        parameters.valid_from_date,
        parameters.valid_to_date,
        parameters.valid_table,
        parameters.prepare_data_file,
        parameters.dataset,
        parameters.price_scaling,
        client)

    create_table(
        parameters.test_from_date,
        parameters.test_to_date,
        parameters.test_table,
        parameters.prepare_data_file,
        parameters.dataset,
        parameters.price_scaling,
        client)


def generate_mean_std(client, parameters):
    """Computes mean and standard deviation.

    Runs BigQuery query to compute mean and standard deviation of all weather
    features and saves the results to storage.

    Args:
        client: `google.cloud.bigquery.client.Client` instance.
        parameters: Parameters passed to script.
    """
    query_params = [
        bigquery.ScalarQueryParameter(
            'train_from_date',
            'STRING',
            parameters.train_from_date),
        bigquery.ScalarQueryParameter(
            'train_to_date',
            'STRING',
            parameters.train_to_date)]

    job_config = bigquery.QueryJobConfig()
    job_config.query_parameters = query_params

    with open(parameters.weather_mean_std_file, 'r') as myfile:
        query = myfile.read()

    results = run_query(
        client,
        query,
        job_config)

    for row in results:
        mean = np.array(row.mean, dtype=np.float32)
        std = np.array(row.std, dtype=np.float32)

    with file_io.FileIO(
        parameters.mean_path,
        mode='wb+'
    ) as f:
        pickle.dump(mean, f, protocol=2)

    with file_io.FileIO(
        parameters.std_path,
        mode='wb+'
    ) as f:
        pickle.dump(std, f, protocol=2)


def main():
    """Main function to be run when executing script."""
    parameters = initialise_params()
    client = bigquery.Client()
    generate_data(client, parameters)
    generate_mean_std(client, parameters)


if __name__ == '__main__':
    main()
