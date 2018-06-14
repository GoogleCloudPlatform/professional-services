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
This is script defines a PySpark Job to enhance avro files exported from the BigQuery Public Dataset
nyc-tlc:yellow.trips to include an additional average speed column. This is a quite simple spark job
which is merely a placeholder to demonstrate Cloud Composer as a way to automate spinning up a
Dataproc cluster to run a spark job and tear it down once the job completes.
"""

import argparse
import datetime
import json
import sys

from pyspark import SparkConf, SparkContext

class AverageSpeedEnhancer:
    def __init__(self):
        """This Class serves as a namespace for the business logic function"""
        self.output_schema = [  # This is the schema of nyc-tlc:yellow.trips
            "vendor_id",
            "pickup_datetime",
            "dropoff_datetime",
            "pickup_longitude",
            "pickup_latitude",
            "dropoff_longitude",
            "dropoff_latitude",
            "rate_code",
            "passenger_count",
            "trip_distance",
            "payment_type",
            "fare_amount",
            "extra",
            "mta_tax",
            "imp_surcharge",
            "tip_amount",
            "tolls_amount",
            "total_amount",
            "store_and_fwd_flag",
            "average_speed"
        ]

    def dict_to_csv(self, dictionary):
        """This funciton converts a python dictionary to a CSV line. Note keys in output schema that
        are missing in the dictionary or that contains commas (which happens occasionally with the
        store_and_fwd_flags fields due to a data quality issue) will result in empty values.
        Arguments:
            dictionary: A dictionary containing the data of interest.
        """
        csv = ','.join([str(dictionary[key]) if dictionary.get(key) is not None else ''
                        for key in self.output_schema])
        return csv

    def enhance_with_avg_speed(self, record):
        """
        This is the business logic for the average speed column to calculate for each record.
        The desired units are miles per hour.
        Arguments:
            record: A dict record from the nyc-tlc:yellow Public BigQuery table to be transformed
                    with an average_speed field. (This argument object gets modified in place by
                    this method).
        """
        # Check if store_and_fwd_flag is a legal value 'Y' or 'N'
        # (there is some data quality issue in the public table chosen for this example).
        if record.get('store_and_fwd_flag') and record.get('store_and_fwd_flag') not in 'YN':
            record['store_and_fwd_flag'] = None

        # Check that fields necessary for calculation are not empty for this record.
        if (record['pickup_datetime'] and record['dropoff_datetime']
                and record['trip_distance'] > 0):
            # Parse strings output by BigQuery to create datetime objects
            time_0 = datetime.datetime.strptime(record['pickup_datetime'],
                                                '%Y-%m-%d %H:%M:%S UTC')
            time_1 = datetime.datetime.strptime(record['dropoff_datetime'],
                                                '%Y-%m-%d %H:%M:%S UTC')
            # Calculate a time_delta object between the pickup and drop off times.
            elapsed = time_1 - time_0
            if elapsed > datetime.timedelta(0):  # Only calculate if drop off after pick up.
                # Calculate speed in miles per hour.
                record['average_speed'] = (3600.0 * record['trip_distance']) / \
                                           elapsed.total_seconds()
            else:  # Speed is either negative or undefined.
                record['average_speed'] = None
        elif record['trip_distance'] == 0.0:
            record['average_speed'] = 0.0
        else:  # One of the fields required for calculation is None.
            record['average_speed'] = None

        # Writes a csv instead of json
        csv_record = self.dict_to_csv(record)
        return csv_record


def main(sc, gcs_path_raw, gcs_path_transformed):
    ase = AverageSpeedEnhancer()
    # Create an AverageSpeedEnhancer instance which contains our business logic
    file_strings_rdd = sc.textFile(gcs_path_raw)
    # Apply the speed enhancement logic defined in the AverageSpeedEnhancer class
    # Read the newline delimited json into dicts (note that this is automatically applied per line).
    records_rdd = file_strings_rdd.map(lambda record_string: json.loads(record_string))
    # Enhance dicts with an average speed field.
    transformed_records_rdd = records_rdd.map(ase.enhance_with_avg_speed)
    # Save output to the timestamped output directory.
    transformed_records_rdd.saveAsTextFile(gcs_path_transformed)


if __name__ == "__main__":

    # Configure Spark
    spark_conf = SparkConf()
    spark_conf.setAppName('AverageSpeedEnhancement')
    spark_context = SparkContext(conf=spark_conf)

    parser = argparse.ArgumentParser()

    # This is the path to the existing files in GCS that are the candidates for enhancement.
    parser.add_argument('--gcs_path_raw', dest='gcs_path_raw',
                        required=True,
                        help='Specify the full GCS wildcard path to the json files to enhance.')

    # This is the path where the transformed data will be staged for airflow to pick it up and load
    # to BigQuery.
    # Appending timestamp to avoid job failing because directory already exists.
    parser.add_argument('--gcs_path_transformed', dest='gcs_path_transformed',
                        required=True,
                        help='Specify the full GCS path prefix for the transformed json files. ')
    argv = sys.argv
    known_args, _ = parser.parse_known_args(None)

    # Execute Main functionality
    main(sc=spark_context, gcs_path_raw=known_args.gcs_path_raw,
         gcs_path_transformed=known_args.gcs_path_transformed)
