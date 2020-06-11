# Copyright 2019 Google Inc.
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#            http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.

import unittest
import os

from slo_generator.utils import (get_human_time, get_backend_cls,
                                 get_exporter_cls, import_dynamic, normalize)


class TestUtils(unittest.TestCase):

    def test_get_human_time(self):
        timestamp = 1565092435
        human_time = "2019-08-06T13:53:55.000000Z"
        timestamp_2 = 1565095633.9568892
        human_time_2 = "2019-08-06T14:47:13.956889Z"
        self.assertEqual(get_human_time(timestamp, timezone='Europe/Paris'),
                         human_time)
        self.assertEqual(get_human_time(timestamp_2, timezone='Europe/Paris'),
                         human_time_2)

    def test_get_backend_cls(self):
        res1 = get_backend_cls("Stackdriver")
        res2 = get_backend_cls("Prometheus")
        self.assertEqual(res1.__name__, "StackdriverBackend")
        self.assertEqual(res2.__name__, "PrometheusBackend")
        with self.assertRaises(SystemExit):
            get_backend_cls("UndefinedBackend")

    def test_get_exporter_cls(self):
        res1 = get_exporter_cls("Stackdriver")
        res2 = get_exporter_cls("Pubsub")
        res3 = get_exporter_cls("Bigquery")
        self.assertEqual(res1.__name__, "StackdriverExporter")
        self.assertEqual(res2.__name__, "PubsubExporter")
        self.assertEqual(res3.__name__, "BigqueryExporter")
        with self.assertRaises(SystemExit):
            get_exporter_cls("UndefinedExporter")

    def test_import_dynamic(self):
        res1 = import_dynamic("slo_generator.backends.stackdriver",
                              "StackdriverBackend",
                              prefix="backend")
        res2 = import_dynamic("slo_generator.exporters.stackdriver",
                              "StackdriverExporter",
                              prefix="exporter")
        self.assertEqual(res1.__name__, "StackdriverBackend")
        self.assertEqual(res2.__name__, "StackdriverExporter")
        with self.assertRaises(SystemExit):
            import_dynamic("slo_generator.backends.unknown",
                           "StackdriverUnknown",
                           prefix="unknown")

    def test_normalize(self):
        path = "../"
        normalized_path = '/'.join(os.getcwd().split('/')[:-1])
        res = normalize(path)
        self.assertEqual(res, normalized_path)


if __name__ == '__main__':
    unittest.main()
