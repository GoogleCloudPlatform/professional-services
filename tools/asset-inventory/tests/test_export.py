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

"""Test Cloud Asset Inventory export."""

import argparse
import logging
import unittest

from asset_inventory import export
import mock


class TestExport(unittest.TestCase):
    """Test syncing of projects."""

    def setUp(self):
        logging.basicConfig(level=logging.DEBUG)

    @mock.patch('asset_inventory.export.export_to_gcs')
    def test_export_to_gcs_content_types(self, mock_export_to_gcs):
        export.export_to_gcs_content_types('parent', 'gcs_prefix',
                                           ['RESOURCE'], ['a', 'b'])

        mock_export_to_gcs.assert_has_calls([
            mock.call('parent', 'gcs_prefix/RESOURCE.json', 'RESOURCE',
                      ['a', 'b']),
        ])
        self.assertEqual(mock_export_to_gcs.call_count, 1)

    @mock.patch('asset_inventory.export.export_to_gcs')
    def test_export_to_gcs_all_content_types(self, mock_export_to_gcs):
        export.export_to_gcs_content_types('parent', 'gcs_prefix', None, None)
        self.assertEqual(mock_export_to_gcs.call_count, 2)

    def test_parse_args_1(self):
        ap = argparse.ArgumentParser()
        export.add_argparse_args(ap)
        args = ap.parse_args([
            '--gcs-destination',
            'gs://b/o',
            '--content-types',
            'RESOURCE, IAM_POLICY',
            '--parent',
            'projects/projectid',
        ])
        self.assertIsNone(args.asset_types)
        self.assertEqual(args.gcs_destination, 'gs://b/o')
        self.assertEqual(args.content_types, ['RESOURCE', 'IAM_POLICY'])
        self.assertEqual(args.parent, 'projects/projectid')

    def test_parse_args_2(self):
        ap = argparse.ArgumentParser()
        export.add_argparse_args(ap)
        args = ap.parse_args([
            '--gcs-destination',
            'gs://b/o',
            '--asset-types',
            'google.compute.Instance, google.compute.Firewall',
            '--parent',
            'projects/projectid',
        ])
        self.assertEqual(args.gcs_destination, 'gs://b/o')
        self.assertEqual(args.content_types, ['RESOURCE', 'IAM_POLICY'])
        self.assertEqual(args.asset_types, [
            'google.compute.Instance', 'google.compute.Firewall'
        ])
        self.assertEqual(args.parent, 'projects/projectid')

    @mock.patch('argparse.ArgumentParser.parse_args')
    @mock.patch('asset_inventory.export.export_to_gcs_content_types')
    @mock.patch(
        'asset_inventory.export.export_to_gcs')
    def test_main(self, mock_export_to_gcs, mock_export_to_gcs_content_types,
                  mock_parse_args):
        export.main()
        mock_parse_args.assert_called_once_with()
        self.assertEqual(mock_export_to_gcs_content_types.call_count, 1)
        mock_export_to_gcs.assert_not_called()


if __name__ == '__main__':
    unittest.main()
