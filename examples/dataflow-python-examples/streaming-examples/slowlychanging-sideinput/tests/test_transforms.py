# Copyright 2020 Google Inc.
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
"""This module contains various tests to validate the transforms"""
import json
import re
import unittest

from sideinput_refresh import coders, main, transforms


class TestSubroutines(unittest.TestCase):

    def test_UTF8JsonCoder_valid_message(self):
        message = {"id": 1, "name": "john"}
        utf8_jsoncoder = coders.UTF8JsonCoder()
        #Check encode functionality
        utfbytes = json.dumps(message).encode()
        self.assertEqual(utf8_jsoncoder.encode(message), utfbytes,
                         "UTF8JsonCoder encoding failed")

        #Check decode functionality
        utfbytes = json.dumps(message).encode()
        self.assertEqual(utf8_jsoncoder.decode(utfbytes), message,
                         "UTF8JsonCoder decoding failed")

    def test_UTF8JsonCoder_invalid_message(self):
        message = '{"id": 1, "name: "john"}'
        utf8_jsoncoder = coders.UTF8JsonCoder()
        with self.assertLogs(logger=None, level='INFO') as log:
            utf8_jsoncoder.decode(message.encode("utf8"))
            pattern = "ERROR:root:Error (.+) in parsing value (.+)"
            self.assertIsNotNone(
                re.match(pattern, log.output[0]),
                "Invalid utf8 input is not raising decode error")

    def test_subscription_path_with_fullpath(self):
        """Validate the format of subscription path when subscription name contains valid path"""
        subsciption_path = main.get_subscription_path(
            "project-id",
            "projects/test-project/subscriptions/test-subscription")
        self.assertEqual(
            subsciption_path,
            "projects/test-project/subscriptions/test-subscription")

    def test_subscription_path_with_subscribername(self):
        """Validate the format of subscription path when subscription name contains valid path"""
        subsciption_path = main.get_subscription_path("test-project",
                                                      "test-subscription")
        self.assertEqual(
            subsciption_path,
            "projects/test-project/subscriptions/test-subscription")


class TestTransforms(unittest.TestCase):

    def test_transform_kv_of(self):
        """Validate the extraction of key value from an event based on field names """
        event = {
            "product_name": "product 2",
            "bonuspoints": 220,
            "discountpct": 0.35,
            "category": "electronics"
        }
        key_vaue_pair = transforms.kv_of(event, "product_name", "bonuspoints")
        self.assertTupleEqual(key_vaue_pair, ("product 2", 220),
                              "Mismatch in bonuspoints")

        key_vaue_pair = transforms.kv_of(event, "product_name", "discountpct")
        self.assertTupleEqual(key_vaue_pair, ("product 2", 0.35),
                              "Mismatch in discountpct")

        key_vaue_pair = transforms.kv_of(event, "product_name", "category")
        self.assertTupleEqual(key_vaue_pair, ("product 2", "electronics"),
                              "Mismatch in category")

    def test_transform_enrich_event(self):
        """Validate whether sales event is enriched with corresponding side input data """
        sales_event = {
            "Txid": 1,
            "productname": "Product 1",
            "qty": 1,
            "sales": 97.65
        }

        bonus_points = {"Product 1": 245, "product 3": 433}
        discount_pct = {
            "product 3": 0.87,
            "product 2": 0.35,
            "product 2 XL": 0.56
        }
        category = {"product 1 XL": "furniture", "Product 1": "hardware"}

        enriched_event = transforms.enrich_event(
            json.dumps(sales_event).encode(), bonus_points, discount_pct,
            category)

        sales_event["bonuspoints"] = 245
        sales_event["discountpct"] = 0.0
        sales_event["category"] = "hardware"
        self.assertDictEqual(
            enriched_event[1], sales_event,
            "Mismatch found between sales event and enriched event")


if __name__ == '__main__':
    unittest.main()
