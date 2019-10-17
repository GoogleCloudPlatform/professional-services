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

import unittest
import json
from table_validator.utils import bigquery_utils
from google.cloud import bigquery


class TestUtils(unittest.TestCase):

    def __init__(self, config_file):
        super().__init__()
        with open(config_file) as json_file:
            self.config_data = json.load(json_file)
            self.verify_config()

    def verify_config(self):
        """
        This method will verify the format of the config file. If anything is out of the ordinary
        format it will let the user know.
        """
        if (self.config_data['leftTablename'].count('.') or self.config_data['rightTablename'].count('.')) != (2 or 1) and self.config_data['leftTablename'].count('.') == self.config_data['rightTablename'].count('.'):
            ValueError('Your configuration file tablenames are not correctly formatted table should be in the format '
                       '`[dataset name].[table name]` or `[project name].[dataset name].[table name]`')
        if 'leftDatasetname' in self.config_data.keys() and 'rightDatasetname' in self.config_data.keys():
            if (self.config_data['leftDatasetname'].count('.') or self.config_data['rightDatasetname'].count('.')) != (1 or 0) and self.config_data['leftDatasetname'].count('.') == self.config_data['rightDatasetname'].count('.'):
                ValueError('Your configuration file datasetnames are not correctly formatted table should be in the '
                           'format `[dataset name]` or `[project name].[dataset name]` in leftDatasetname and '
                           'rightDatasetname')
        if self.config_data['destinationDataset'].count('.') > 0:
            ValueError('destinationDataset should not have any `.`')

        lproject_id, rproject_id = '', ''
        if self.config_data['leftTablename'].count('.') == 2:
            lproject_id, ldataset, ltablename = self.config_data['leftTablename'].split('.')
            rproject_id, rdataset, rtablename = self.config_data['rightTablename'].split('.')
        else:
            ldataset, ltablename = self.config_data['leftTablename'].split('.')
            rdataset, rtablename = self.config_data['rightTablename'].split('.')
        self.left_tablename = ldataset + '.' + ltablename
        self.right_tablename = rdataset + '.' + rtablename
        if 'leftDatasetname' in self.config_data.keys() and self.config_data['leftDatasetname'].count('.') == 1:
            lproject_id, _ = self.config_data['leftDatasetname'].split('.')
            rproject_id, _ = self.config_data['rightDatasetname'].split('.')
        if lproject_id != rproject_id:
            ValueError('Project names in tablenames and datasetnames should be equal')
        self.client = bigquery.Client(project=self.config_data['project_id'])

    def test_compare_columns(self):
        self.assertTrue(
            bigquery_utils.compare_columns([3, 2, 1],
                                           [3, 2, 1]), msg='two columns are not equal')
        self.assertFalse(
            bigquery_utils.compare_columns(['1', '2', '3'],
                                           ['3', '2']), msg='two columns are equal')

    def test_get_console_link_for_table_ref_and_get_table_ref_and_query_job_link(self):

        left_table = bigquery_utils.get_table_ref(self.client,
                                                  self.left_tablename)
        right_table = bigquery_utils.get_table_ref(self.client,
                                                   self.right_tablename)
        self.assertTrue(left_table)
        self.assertFalse(
            bigquery_utils.get_table_ref(self.client,
                                         self.config_data['project_id']))
        self.assertTrue(right_table)
        self.assertTrue(
            bigquery_utils.get_console_link_for_table_ref(left_table))
        self.assertRaises(
            bigquery_utils.get_console_link_for_table_ref(left_table))
        self.assertTrue(
            bigquery_utils.get_console_link_for_table_ref(right_table))

        job_config = bigquery.QueryJobConfig()
        table_ref = bigquery_utils.get_table_ref(self.client, self.config_data['destinationDataset'])
        destination_dataset = self.config_data['destinationDataset']
        destination_table = '{}.{}'.format(destination_dataset, self.left_tablename.split('.')[1])

        print('Creating ( {} )'.format(destination_table.split('.')[1]))
        if table_ref:
            job_config.destination = table_ref
            job_config.write_disposition = 'WRITE_TRUNCATE'

        # Start the query, passing in the extra configuration.
        query_job = self.client.query('SELECT word, SUM(word_count) AS count FROM '
                                      '`bigquery-public-data`.samples.shakespeare WHERE word LIKE "%raisin%" GROUP BY'
                                      ' word', job_config=job_config)
        query_link = bigquery_utils.get_console_link_for_query_job(query_job)
        self.assertTrue(query_link)
        print('View Query\n{}'.format(query_link))

    def get_full_columns_list(self):
        self.assertTrue(
            bigquery_utils.get_full_columns_list(self.client, self.config_data['excludeColumnMapping'],
                                                 self.config_data['primaryKeys'], self.left_tablename,
                                                 self.right_tablename)
        )
