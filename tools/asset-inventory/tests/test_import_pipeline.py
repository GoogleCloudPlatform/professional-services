#!/usr/bin/env python

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
"""Test import beam pipeline."""

import glob
import json
import os
import unittest
import warnings

from asset_inventory import import_pipeline
import mock
from six import string_types

STAGE_PATH = 'tests/data/stage'


class TestImportPipeline(unittest.TestCase):

    def setUp(self):

        if not os.path.exists(STAGE_PATH):
            os.mkdir(STAGE_PATH)
        for old_test_file in os.listdir(STAGE_PATH):
            os.remove(os.path.join(STAGE_PATH, old_test_file))

    @mock.patch('google.cloud.bigquery.Client')
    def test_assets(self, _):
        with warnings.catch_warnings():
            warnings.filterwarnings('ignore',
                                    'The compiler package is deprecated')
            import_pipeline.run([
                '--load_time=',
                '--input=tests/data/iam_policy.json', '--group_by=ASSET_TYPE',
                '--stage={}'.format(STAGE_PATH), '--dataset=test_iam_policy'
            ])

            rows = []
            for fn in glob.glob(os.path.join(STAGE_PATH, 'google.*')):
                with open(fn) as f:
                    for line in f:
                        rows.append(json.loads(line))
            self.assertEqual(len(rows), 2)
            found_names = {}
            for row in rows:
                found_names[row['name']] = row
                self.assertEqual(row['asset_type'],
                                 'google.cloud.billing.BillingAccount')
            self.assertEqual(len(found_names), 2)

    @mock.patch('google.cloud.bigquery.Client')
    def test_resources(self, _):
        with warnings.catch_warnings():
            warnings.filterwarnings('ignore',
                                    'The compiler package is deprecated')
            import_pipeline.run([
                '--load_time=',
                '--input=tests/data/resource.json', '--group_by=ASSET_TYPE',
                '--stage={}'.format(STAGE_PATH), '--dataset=test_iam_resource'
            ])

            rows = []
            export_files = 0
            for fn in glob.glob(os.path.join(STAGE_PATH, 'google.compute.*')):
                export_files += 1
                with open(fn) as f:
                    for line in f:
                        rows.append(json.loads(line))
            self.assertEqual(export_files, 2)
            found_assets = {}
            found_names = {}
            for row in rows:
                found_assets[row['asset_type']] = row
                found_names[row['name']] = row
            self.assertEqual(len(found_names), 2)
            self.assertEqual(len(found_assets), 2)
            instance_row = found_assets['google.compute.Instance']
            instance_labels = instance_row['resource']['data']['labels']
            self.assertIsInstance(instance_labels, list)
            self.assertEqual(len(instance_labels), 1)

    @mock.patch('google.cloud.bigquery.Client')
    def test_load_group_by_none(self, _):
        with warnings.catch_warnings():
            warnings.filterwarnings('ignore',
                                    'The compiler package is deprecated')
            import_pipeline.run([
                '--load_time=',
                '--input=tests/data/resource.json', '--group_by=NONE',
                '--stage={}'.format(STAGE_PATH), '--dataset=test_resource'
            ])
            rows = []
            export_files = 0
            for fn in glob.glob(os.path.join(STAGE_PATH, '*.json')):
                export_files += 1
                with open(fn) as f:
                    for line in f:
                        rows.append(json.loads(line))
            self.assertEqual(export_files, 1)
            found_assets = {}
            found_names = {}
            for row in rows:
                found_assets[row['asset_type']] = row
                found_names[row['name']] = row
            self.assertEqual(len(found_names), 2)
            self.assertEqual(len(found_assets), 2)
            instance_row = found_assets['google.compute.Instance']
            resource_properties = instance_row['resource']['json_data']
            self.assertIsInstance(resource_properties, string_types)
            self.assertNotIn('data', instance_row['resource'])


if __name__ == '__main__':
    unittest.main()
