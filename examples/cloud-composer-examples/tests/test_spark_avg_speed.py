# Copyright 2018 Google Inc.
#
# Licensed under the Apache License, Version 2.0 (the u"License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#            http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an u"AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.

import unittest
import sys
from os import path

# This allows us to perform the relative imports necessary to run  these
# unit tests from the parent directory
# by running:
# python tests/test_spark_avg_speedpy
sys.path.append(path.dirname(path.dirname(path.abspath(__file__))))

from composer_http_post_example.spark_avg_speed import AverageSpeedEnhancer


class TestAverageSpeedEnhancer(unittest.TestCase):
    """The test cases are focused on the business logic.  In this case this is how we parse the
    schemas, generate data and label images.

    Execution Note:
        This script is stored in professional-services/data-analytics/dataflow-python-examples/tests
        but should be copied to professional-services/data-analytics/dataflow-python-examples/ and
        run from there.
    """

    def setUp(self):
        self.average_speed_enhancer = AverageSpeedEnhancer()

    def test_json_to_csv_conversion(self):
        # Note this record does not contain rate_code, mta_tax, imp_surcharge which
        # tests the maintaining of csv order in the case of an incomplete/jagged record
        partial_record = {
          u"vendor_id": u"CMT",
          u"pickup_datetime": u"2009-04-05 21:00:01 UTC",
          u"dropoff_datetime": u"2009-04-05 21:07:28 UTC",
          u"pickup_longitude": -73.954192,
          u"pickup_latitude": 40.787271,
          u"dropoff_longitude": -73.976447,
          u"dropoff_latitude": 40.764421,
          u"passenger_count": u"2",
          u"trip_distance": 2.3,
          u"payment_type": u"CSH",
          u"fare_amount": 8.23,
          u"extra": 0,
          u"tip_amount": 0,
          u"tolls_amount": 0,
          u"total_amount": 8.23,
          u"store_and_fwd_flag": u"N",
          u"average_speed": 18.523489932885905
        }

        expected_partial_csv = ','.join(['CMT',
                                 '2009-04-05 21:00:01 UTC',
                                 '2009-04-05 21:07:28 UTC',
                                 '-73.954192',
                                 '40.787271',
                                 '-73.976447',
                                 '40.764421',
                                 '',
                                 '2',
                                 '2.3',
                                 'CSH',
                                 '8.23',
                                 '0',
                                 '',
                                 '',
                                 '0',
                                 '0',
                                 '8.23',
                                 'N',
                                 '18.523489932885905'
                                 ])
        actual_partial_csv = self.average_speed_enhancer.dict_to_csv(partial_record)

        self.assertEqual(expected_partial_csv, actual_partial_csv)


        full_record = {
            u"vendor_id": u"CMT",
            u"pickup_datetime": u"2009-04-05 21:00:01 UTC",
            u"dropoff_datetime": u"2009-04-05 21:07:28 UTC",
            u"pickup_longitude": -73.954192,
            u"pickup_latitude": 40.787271,
            u"dropoff_longitude": -73.976447,
            u"dropoff_latitude": 40.764421,
            u"passenger_count": u"2",
            u"trip_distance": 2.3,
            u"payment_type": u"CSH",
            u"fare_amount": 8.23,
            u"extra": 0,
            u"tip_amount": 0,
            u"tolls_amount": 0,
            u"total_amount": 8.23,
            u"store_and_fwd_flag": u"N",
            u"average_speed": 18.523489932885905,
            u"rate_code": 1,
            u"mta_tax": 0.0,
            u"imp_surcharge": 0.3
        }

        expected_full_csv = ','.join(['CMT',
                                 '2009-04-05 21:00:01 UTC',
                                 '2009-04-05 21:07:28 UTC',
                                 '-73.954192',
                                 '40.787271',
                                 '-73.976447',
                                 '40.764421',
                                 '1',
                                 '2',
                                 '2.3',
                                 'CSH',
                                 '8.23',
                                 '0',
                                 '0.0',
                                 '0.3',
                                 '0',
                                 '0',
                                 '8.23',
                                 'N',
                                 '18.523489932885905'
                                 ])
        actual_full_csv = self.average_speed_enhancer.dict_to_csv(full_record)

        self.assertEqual(expected_full_csv, actual_full_csv)

    def test_enhance_with_average_speed(self):
        # Test a zero speed.
        zero_record = {
           u"vendor_id": u"CMT",
           u"pickup_datetime": u"2010-03-04 00:35:16 UTC",
           u"dropoff_datetime": u"2010-03-04 00:35:47 UTC",
           u"pickup_longitude": -74.035201,
           u"pickup_latitude": 40.721548,
           u"dropoff_longitude": -74.035201,
           u"dropoff_latitude": 40.721548,
           u"rate_code": u"1",
           u"passenger_count": u"1",
           u"trip_distance": 0,
           u"payment_type": u"Cas",
           u"fare_amount": 0,
           u"extra": 0,
           u"mta_tax": 0,
           u"tip_amount": 0,
           u"tolls_amount": 0,
           u"total_amount": 0,
           u"store_and_fwd_flag": u"Y"
        }

        zero_enhancement = self.average_speed_enhancer.dict_to_csv({
            u"vendor_id": u"CMT",
            u"pickup_datetime": u"2010-03-04 00:35:16 UTC",
            u"dropoff_datetime": u"2010-03-04 00:35:47 UTC",
            u"pickup_longitude": -74.035201,
            u"pickup_latitude": 40.721548,
            u"dropoff_longitude": -74.035201,
            u"dropoff_latitude": 40.721548,
            u"rate_code": u"1",
            u"passenger_count": u"1",
            u"trip_distance": 0,
            u"payment_type": u"Cas",
            u"fare_amount": 0,
            u"extra": 0,
            u"mta_tax": 0,
            u"tip_amount": 0,
            u"tolls_amount": 0,
            u"total_amount": 0,
            u"store_and_fwd_flag": u"Y",
            u"average_speed": 0.0
        })

        actual_enhancement = self.average_speed_enhancer.enhance_with_avg_speed(zero_record)


        self.assertEqual(actual_enhancement, zero_enhancement)

        # Test a non-zero speed.
        example_record = {
          u"vendor_id": u"CMT",
          u"pickup_datetime": u"2009-04-05 21:00:01 UTC",
          u"dropoff_datetime": u"2009-04-05 21:07:28 UTC",
          u"pickup_longitude": -73.954192,
          u"pickup_latitude": 40.787271,
          u"dropoff_longitude": -73.976447,
          u"dropoff_latitude": 40.764421,
          u"passenger_count": u"2",
          u"trip_distance": 2.3,
          u"payment_type": u"CSH",
          u"fare_amount": 8.23,
          u"extra": 0,
          u"tip_amount": 0,
          u"tolls_amount": 0,
          u"total_amount": 8.23,
          u"store_and_fwd_flag": u"N"
        }

        expected_enhancement = self.average_speed_enhancer.dict_to_csv({
          u"vendor_id": u"CMT",
          u"pickup_datetime": u"2009-04-05 21:00:01 UTC",
          u"dropoff_datetime": u"2009-04-05 21:07:28 UTC",
          u"pickup_longitude": -73.954192,
          u"pickup_latitude": 40.787271,
          u"dropoff_longitude": -73.976447,
          u"dropoff_latitude": 40.764421,
          u"passenger_count": u"2",
          u"trip_distance": 2.3,
          u"payment_type": u"CSH",
          u"fare_amount": 8.23,
          u"extra": 0,
          u"tip_amount": 0,
          u"tolls_amount": 0,
          u"total_amount": 8.23,
          u"store_and_fwd_flag": u"N",
          u"average_speed": 18.523489932885905
        })

        actual_enhancement = self.average_speed_enhancer.enhance_with_avg_speed(example_record)

        self.assertEqual(actual_enhancement, expected_enhancement)

        # Test handling of invalid pickup/dropoff times.
        example_record = {
          u"vendor_id": u"CMT",
          u"pickup_datetime": u"2009-04-05 21:07:28 UTC",
          u"dropoff_datetime": u"2009-04-05 21:00:01 UTC",
          u"pickup_longitude": -73.954192,
          u"pickup_latitude": 40.787271,
          u"dropoff_longitude": -73.976447,
          u"dropoff_latitude": 40.764421,
          u"passenger_count": u"2",
          u"trip_distance": 2.3,
          u"payment_type": u"CSH",
          u"fare_amount": 8.23,
          u"extra": 0,
          u"tip_amount": 0,
          u"tolls_amount": 0,
          u"total_amount": 8.23,
          u"store_and_fwd_flag": u"N"
        }

        expected_enhancement = self.average_speed_enhancer.dict_to_csv({
          u"vendor_id": u"CMT",
          u"pickup_datetime": u"2009-04-05 21:07:28 UTC",
          u"dropoff_datetime": u"2009-04-05 21:00:01 UTC",
          u"pickup_longitude": -73.954192,
          u"pickup_latitude": 40.787271,
          u"dropoff_longitude": -73.976447,
          u"dropoff_latitude": 40.764421,
          u"passenger_count": u"2",
          u"trip_distance": 2.3,
          u"payment_type": u"CSH",
          u"fare_amount": 8.23,
          u"extra": 0,
          u"tip_amount": 0,
          u"tolls_amount": 0,
          u"total_amount": 8.23,
          u"store_and_fwd_flag": u"N",
          u"average_speed": None
        })

        actual_enhancement = self.average_speed_enhancer.enhance_with_avg_speed(example_record)

        self.assertEqual(actual_enhancement, expected_enhancement)

        # Test an example with an illegal store_and_fwd_flag
        bad_store_and_fwd_record = {
            u"vendor_id": u"CMT",
            u"pickup_datetime": u"2009-04-05 21:00:01 UTC",
            u"dropoff_datetime": u"2009-04-05 21:07:28 UTC",
            u"pickup_longitude": -73.954192,
            u"pickup_latitude": 40.787271,
            u"dropoff_longitude": -73.976447,
            u"dropoff_latitude": 40.764421,
            u"passenger_count": u"2",
            u"trip_distance": 2.3,
            u"payment_type": u"CSH",
            u"fare_amount": 8.23,
            u"extra": 0,
            u"tip_amount": 0,
            u"tolls_amount": 0,
            u"total_amount": 8.23,
            u"store_and_fwd_flag": u",",
        }

        expected_csv = ','.join(['CMT',
                                 '2009-04-05 21:00:01 UTC',
                                 '2009-04-05 21:07:28 UTC',
                                 '-73.954192',
                                 '40.787271',
                                 '-73.976447',
                                 '40.764421',
                                 '',
                                 '2',
                                 '2.3',
                                 'CSH',
                                 '8.23',
                                 '0',
                                 '',
                                 '',
                                 '0',
                                 '0',
                                 '8.23',
                                 '',
                                 '18.523489932885905'
                                 ])
        actual_csv = self.average_speed_enhancer.enhance_with_avg_speed(bad_store_and_fwd_record)

        self.assertEqual(expected_csv, actual_csv)


if __name__ == '__main__':
    unittest.main()
