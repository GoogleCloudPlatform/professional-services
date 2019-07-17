# Copyright 2019 Google LLC
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#         http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.

import sys
sys.path.append('..')
# noinspection PyPep8
import unittest
from project_label_updater import project_label_updater
import access_setup
import httplib2
from oauth2client.service_account import ServiceAccountCredentials
import os
from apiclient.discovery import build
import storage_label_updater
import bigtable_label_updater
import compute_engine_label_updater
# noinspection PyPep8
import bigquery_label_updater


# noinspection PyUnusedLocal
class TestProjectLabel(unittest.TestCase):
    """
    This class is a test suite to test functions used in gcp_label_updater.py
    """
    # TODO: move these to a config file
    test_projectid = "cardinal-data-piper-sbx"
    test_data_tags_1 = {'env1': 'test1', 'env2': 'test2'}
    test_data_tags_2 = {}
    test_data_tags_3 = {'env1': 'test1'}

    test_data_tags_list = list()
    test_data_tags_list.append(test_data_tags_1)
    test_data_tags_list.append(test_data_tags_2)
    test_data_tags_list.append(test_data_tags_3)

    def assert_test_data_tags(self, input_tags, updated_labels):
        """
        Asserts all input key value pair existence in updated_resource
        :param input_tags:
        :param updated_labels:
        """
        for k, v in input_tags.items():
            self.assertTrue(k in updated_labels.keys())
            self.assertEqual(updated_labels[k], v)

    def setUp(self):
        """
        Set up the test environment. In a property file two variables need to be exported in the environment.
        It takes the key file and sets up the authentication to run the api.
        Variable names are : key_file and crm_version
        e.g. export key_file=project_service_account.json
            export crm_verion=v1
        """
        scope = ['https://www.googleapis.com/auth/cloud-platform',
                 'https://www.googleapis.com/auth/spreadsheets',
                 'https://www.googleapis.com/auth/drive']

        key_file = self.get_env_var('key_file')

        crm_version = self.get_env_var('crm_version')

        credentials = ServiceAccountCredentials.from_json_keyfile_name(key_file, scope)
        http = httplib2.Http()
        credentials.authorize(http)
        crm = build('cloudresourcemanager', crm_version, http=http)

    def get_env_var(self, key_name):
        """
        Get the environment variables and save it to a variable.
        :param key_name: e.g. key_file
        """
        return os.environ.get(key_name, 'Key name is not set')

    def test_project_label_updater_insert(self):
        """
        Tests project_label_updater without header in config file.
        """
        config_file = "update_labels_no_header.config"
        for test_data_tags in self.test_data_tags_list:
            updated_project = project_label_updater(config_file, self.test_projectid, test_data_tags)
            updated_labels = updated_project['labels']
            self.assert_test_data_tags(test_data_tags, updated_labels)

    # noinspection PyUnusedLocal
    def test_storage_label_updater(self):
        """
        Tests storage_label_updater functionality.
        """
        storage_resourceid = 'data-piper1'
        config_file = "update_labels.config"
        for test_data_tags in self.test_data_tags_list:
            updated_bucket = storage_label_updater.storage_label_updater(storage_resourceid, test_data_tags)
            updated_labels = updated_bucket.labels
            self.assert_test_data_tags(test_data_tags, updated_labels)

    def test_compute_engine_updater(self):
        """
        Tests compute engine label updater (gce_label_updater) functionality.
        """
        config_file = "update_labels.config"
        resourceid = '5760604619992189475'
        zone = 'us-west2-a'

        for test_data_tags in self.test_data_tags_list:
            updated_instance = compute_engine_label_updater.gce_label_updater(config_file, self.test_projectid,
                                                                    resourceid, zone, test_data_tags)
            updated_labels = updated_instance['labels']
            self.assert_test_data_tags(test_data_tags, updated_labels)

    def test_bigquery_label_updater(self):
        """
        Tests bigquery_label_updater functionality.
        """
        config_file = "update_labels.config"
        resourceid = 'BQ_label_test_1'

        for test_data_tags in self.test_data_tags_list:
            updated_dataset = bigquery_label_updater.bigquery_label_updater(config_file, self.test_projectid,
                                                                            resourceid, test_data_tags)
            updated_labels = updated_dataset.labels
            self.assert_test_data_tags(test_data_tags, updated_labels)

    def test_bigquery_table_label_updater(self):
        """
        Test BigQuery table label updater.
        """
        config_file = "update_labels.config"
        resource_id = "BQ_label_test_1"
        subresourceid = "gcp_organization_folder_hierarchy"

        for test_data_tags in self.test_data_tags_list:
            updated_table = bigquery_label_updater.bigquery_table_label_updater(config_file, self.test_projectid,
                                                                            resource_id, subresourceid, test_data_tags)
            updated_labels = updated_table.labels
            self.assert_test_data_tags(test_data_tags, updated_labels)

    def test_bigtable_label_updater(self):
        """
        Tests bigtable_label_updater functionality.
        """
        config_file = "update_labels.config"
        resourceid = 'data-piper1'

        for test_data_tags in self.test_data_tags_list:
            updated_instance = bigtable_label_updater.bigtable_label_updater(self.test_projectid, resourceid,
                                                                             test_data_tags)
            updated_labels = updated_instance.labels
            self.assert_test_data_tags(test_data_tags, updated_labels)

    def test_isheader_without_header(self):
        """
        Testing access_setup.is_header function.
        """
        config_file = "update_labels_none_header.config"

        contains_header = access_setup.is_header(config_file)

        self.assertTrue(contains_header, 'N')

#####################################################


if __name__ == "__main__":
    unittest.main()
