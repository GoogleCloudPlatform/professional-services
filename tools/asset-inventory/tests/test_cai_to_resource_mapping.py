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

import unittest

from asset_inventory.cai_to_api import CAIToAPI


class TestCAIToAPIMapping(unittest.TestCase):
    """
    Tests the appliccation of CAI property mappings.

    given a mapping like this:

    "Instance": {
        "cai_to_api_names": {
            "disk": "disks",
            "guestAccelerator": "guestAccelerators",
            "networkInterface": "networkInterfaces",
            "resourcePolicy": "resourcePolicies",
            "serviceAccount": "serviceAccounts"
        },
        "disk": {
            "cai_to_api_names": {
                "guestOsFeature": "guestOsFeatures",
                "license": "licenses"
            }
        }
    }

    and a json of:

    {'disk': [{'license': 'value1',
               'guestOsFeature': 'value2',
               'unchanged': 'value3'}],
     'unchanged': 'value4'}

    the output should be:

    {'disks': [{'licenses': 'value1',
               'guestOsFeatures': 'value2',
               'unchanged': 'value3'}],
     'unchanged': 'value4'}
    """

    def test_instance_mapping(self):
        cai_properties = {'disk': [{'license': 'value1',
                                    'guestOsFeature': 'value2',
                                    'unchanged': 'value3'}],
                          'unchanged': 'value4'}

        CAIToAPI.cai_to_api_properties(
            'Instance', cai_properties)
        self.assertEqual(cai_properties,
                         {'disks': [{'licenses': 'value1',
                                     'guestOsFeatures': 'value2',
                                     'unchanged': 'value3'}],
                          'unchanged': 'value4'})

    def test_disk_mapping(self):
        cai_properties = {'disk': {'license': 'value1',
                                   'guestOsFeature': 'value2',
                                   'unchanged': 'value3'},
                          'networkInterface': {'accessConfig':
                                               {'externalIp': 'value5'}},
                          'unchanged': 'value4'}

        CAIToAPI.cai_to_api_properties(
            'Instance', cai_properties)
        self.assertEqual(cai_properties,
                         {'disks': {'licenses': 'value1',
                                    'guestOsFeatures': 'value2',
                                    'unchanged': 'value3'},
                          'networkInterfaces': {'accessConfigs':
                                                {'natIP': 'value5'}},
                          'unchanged': 'value4'})
