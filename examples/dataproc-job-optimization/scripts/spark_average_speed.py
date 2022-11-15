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
This is script defines a PySpark Job to enhance avro files exported from the
BigQuery Public Dataset nyc-tlc:yellow.trips to include an additional average
speed column.
"""

import io
import csv
from contextlib import closing
import datetime
import json
import sys

from pyspark import SparkConf, SparkContext


class AverageSpeedEnhancer(object):
    """
    This Class serves as a namespace for the business logic function to
    calculate an average_speed field from trip_distance, pickup_datetime
    and drop off date_time.
    """
    output_schema = [  # This is the schema of nyc-tlc:yellow.trips
        "vendor_id", "pickup_datetime", "dropoff_datetime", "pickup_longitude",
        "pickup_latitude", "dropoff_longitude", "dropoff_latitude",
        "rate_code", "passenger_count", "trip_distance", "payment_type",
        "fare_amount", "extra", "mta_tax", "imp_surcharge", "tip_amount",
        "tolls_amount", "total_amount", "store_and_fwd_flag", "average_speed"
    ]

    def dict_to_csv(self, dictionary):
        """
        This funciton converts a python dictionary to a CSV line. Note keys
        in output schema that are missing in the dictionary or that contains
        commas (which happens occasionally with the store_and_fwd_flags fields
        due to a data quality issue) will result in empty values.
        """
        with closing(io.StringIO()) as csv_string:
            writer = csv.DictWriter(csv_string,
                                    AverageSpeedEnhancer.output_schema)
            writer.writerow(dictionary)
            # Our desired output is a csv string not a line in a file so we
            # strip the newline character written by the writerow function
            # by default.
            return csv_string.getvalue().strip()

    def enhance_with_avg_speed(self, record):
        """
        This is the business logic for the average speed column to calculate
        for each record. The desired units are miles per hour.
        """
        datetime_format = "%Y-%m-%d %H:%M:%S UTC"
        # There is some data quality issue in the public table chosen for
        #  this example.
        if record.get("store_and_fwd_flag") and record.get(
                "store_and_fwd_flag") not in "YN":
            record["store_and_fwd_flag"] = None

        if (record["pickup_datetime"] and record["dropoff_datetime"]
                and record["trip_distance"] > 0):
            # Parse strings output by BigQuery to create datetime objects
            pickup = datetime.datetime.strptime(record["pickup_datetime"],
                                                datetime_format)
            dropoff = datetime.datetime.strptime(record["dropoff_datetime"],
                                                 datetime_format)
            elapsed = dropoff - pickup
            if elapsed > datetime.timedelta(
                    0):  # Only calculate if drop off after pick up.
                # Calculate speed in miles per hour.
                record["average_speed"] = 3600 * record["trip_distance"] / \
                                           elapsed.total_seconds()
            else:  # Speed is either negative or undefined.
                record["average_speed"] = None
        elif record["trip_distance"] == 0.0:
            record["average_speed"] = 0.0
        else:  # One of the fields required for calculation is None.
            record["average_speed"] = None

        csv_record = self.dict_to_csv(record)
        return csv_record


def main(spark_conf, gcs_path_raw, gcs_path_transformed):
    """
    entry point. takes spark conf, an input gcs path, and an output gcs path.
    transforms records by adding average speed value.
    """
    ase = AverageSpeedEnhancer()
    file_strings_rdd = spark_conf.textFile(gcs_path_raw)
    # Apply the speed enhancement logic defined in the AverageSpeedEnhancer
    # class. Read the newline delimited json into dicts (note that this is
    # automatically applied per line).
    records_rdd = file_strings_rdd.map(
        lambda record_string: json.loads(record_string))
    transformed_records_rdd = records_rdd.map(ase.enhance_with_avg_speed)
    transformed_records_rdd.saveAsTextFile(gcs_path_transformed)


if __name__ == "__main__":

    spark_conf_obj = SparkConf()
    spark_conf_obj.setAppName("AverageSpeedEnhancement")
    spark_context = SparkContext(conf=spark_conf_obj)

    main(spark_conf=spark_context,
         gcs_path_raw=sys.argv[1],
         gcs_path_transformed=sys.argv[2])
