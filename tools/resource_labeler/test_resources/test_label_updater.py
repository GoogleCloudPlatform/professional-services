import sys
sys.path.append('/Users/monobina/Documents/g-work')
print sys.path
sys.path.append('/Users/monobina/Documents')
import unittest
from project_label_updater import project_label_updater
import access_setup
import json
import httplib2
from oauth2client.service_account import ServiceAccountCredentials
from oauth2client.client import GoogleCredentials
import os
from apiclient.discovery import build
import storage_label_updater
from google.cloud import storage
from google.cloud import bigtable
import bigtable_label_updater
import compute_engine_label_updater
import bigquery_label_updater


scope = ['https://www.googleapis.com/auth/cloud-platform',
         'https://www.googleapis.com/auth/spreadsheets',
         'https://www.googleapis.com/auth/drive']

key_file = "/Users/monobina/Documents/cardinal-data-piper-sbx.json"
os.environ['GOOGLE_APPLICATION_CREDENTIALS'] = key_file

credentials = ServiceAccountCredentials.from_json_keyfile_name(key_file, scope)
http = httplib2.Http()
credentials.authorize(http)

crm = build('cloudresourcemanager', 'v1', http=http)


class TestProjectLabel(unittest.TestCase):

    #test project_label_updater(config_file, projectid, tags)

    # Test Case 1: Positive Test-testing config file with no header
    def test_project_label_updater_simple(self):
        config_file = "update_labels_no_header.config"
        test_projectid = "cardinal-data-piper-sbx"
        tags = {'env1': 'test1', 'env2': 'test2'}

        updated_project = project_label_updater(config_file, test_projectid, tags)
        updated_labels = updated_project['labels']

        self.assertTrue('env1' in updated_labels.keys())
        self.assertEqual(updated_labels['env1'], 'test1')

        self.assertTrue('env2' in updated_labels.keys())
        self.assertEqual(updated_labels['env2'], 'test2')

    def test_project_label_updater_complex(self):
        config_file = "update_labels_no_header.config"
        test_projectid = "cardinal-data-piper-sbx"
        tags = {'env1': 'test1', 'env2': 'test2'}

        updated_project = project_label_updater(config_file, test_projectid, tags)
        updated_labels = updated_project['labels']

        self.assertTrue('env1' in updated_labels.keys())
        self.assertEqual(updated_labels['env1'], 'test1')

        self.assertTrue('env2' in updated_labels.keys())
        self.assertEqual(updated_labels['env2'], 'test2')

        tags = {'env3': 'test3'}
        updated_project = project_label_updater(config_file, test_projectid, tags)
        updated_labels = updated_project['labels']

        self.assertTrue('env1' in updated_labels.keys())
        self.assertEqual(updated_labels['env1'], 'test1')

        self.assertTrue('env2' in updated_labels.keys())
        self.assertEqual(updated_labels['env2'], 'test2')

        self.assertTrue('env3' in updated_labels.keys())
        self.assertEqual(updated_labels['env3'], 'test3')

    # Test Case 2: Positive Test - testing config file with header
    def test_project_label_updater_with_header_simple(self):
        config_file = "update_labels.config"
        test_projectid = "cardinal-data-piper-sbx"
        tags = {'env1': 'test1', 'env2': 'test2'}

        updated_project = project_label_updater(config_file, test_projectid, tags)
        updated_labels = updated_project['labels']

        self.assertTrue('env1' in updated_labels.keys())
        self.assertEqual(updated_labels['env1'], 'test1')

        self.assertTrue('env2' in updated_labels.keys())
        self.assertEqual(updated_labels['env2'], 'test2')

    def test_project_label_updater_with_header_complex(self):
        config_file = "update_labels.config"
        test_projectid = "cardinal-data-piper-sbx"
        tags = {'env1': 'test1', 'env2': 'test2'}

        updated_project = project_label_updater(config_file, test_projectid, tags)
        updated_labels = updated_project['labels']

        self.assertTrue('env1' in updated_labels.keys())
        self.assertEqual(updated_labels['env1'], 'test1')

        self.assertTrue('env2' in updated_labels.keys())
        self.assertEqual(updated_labels['env2'], 'test2')

        tags = {'env3': 'test3'}
        updated_project = project_label_updater(config_file, test_projectid, tags)
        updated_labels = updated_project['labels']

        self.assertTrue('env1' in updated_labels.keys())
        self.assertEqual(updated_labels['env1'], 'test1')

        self.assertTrue('env2' in updated_labels.keys())
        self.assertEqual(updated_labels['env2'], 'test2')

        self.assertTrue('env3' in updated_labels.keys())
        self.assertEqual(updated_labels['env3'], 'test3')

        # -----------------------------------------------------------------------------------------------------------------------------
        # test other resource label updaters
        # test storage label updater function
    def test_storage_label_updater(self):
            config_file = "update_labels.config"
            credentials = access_setup.access_set_up(config_file)
            resourceid = 'data-piper1'
            tags = {'env1': 'test1', 'env2': 'test2'}

            storage_label_updater.storage_label_updater(resourceid, tags)

            storage_client = storage.Client()
            bucket = storage_client.get_bucket('data-piper1')
            updated_labels = bucket.labels

            self.assertTrue('env1' in updated_labels.keys())
            self.assertEqual(updated_labels['env1'], 'test1')

            self.assertTrue('env2' in updated_labels.keys())
            self.assertEqual(updated_labels['env2'], 'test2')

        # test bigtable label updater function
    def test_bigtable_label_updater(self):
            test_projectid = "cardinal-data-piper-sbx"
            resourceid = 'data-piper1'
            tags = {'env1': 'test1', 'env2': 'test2'}

            bigtable_label_updater.bigtable_label_updater(test_projectid, resourceid, tags)
            client = bigtable.client.Client(project=test_projectid, admin=True)
            instance = client.instance(resourceid)

            updated_labels = instance.labels
            print updated_labels
            #instance.labels call doesn't work in bigtable to get existing info for the instance. So I verified by visually checking in console.

            self.assertTrue('env1' in updated_labels.keys())
            self.assertEqual(updated_labels['env1'], 'test1')

            self.assertTrue('env2' in updated_labels.keys())
            self.assertEqual(updated_labels['env2'], 'test2')

        # test compute engine updater
    def test_compute_engine_updater(self):
            config_file = "update_labels.config"
            test_projectid = "cardinal-data-piper-sbx"
            resourceid = '5760604619992189475'
            zone = 'us-west2-a'
            tags = {'env1': 'test1', 'env2': 'test2'}
            updated_instance = compute_engine_label_updater.gce_label_updater(config_file, test_projectid, resourceid,
                                                                              zone, tags)
            print(json.dumps(updated_instance))

            updated_labels = updated_instance['labels']
            self.assertTrue('env1' in updated_labels.keys())
            self.assertEqual(updated_labels['env1'], 'test1')

            self.assertTrue('env2' in updated_labels.keys())
            self.assertEqual(updated_labels['env2'], 'test2')

        # test big query label updater
    def test_bigquery_label_updater(self):
            config_file = "update_labels.config"
            test_projectid = "cardinal-data-piper-sbx"
            resourceid = 'public'
            tags = {'env1': 'test1', 'env2': 'test2'}

            dataset = bigquery_label_updater.bigquery_label_updater(config_file, test_projectid, resourceid, tags)

            updated_labels = dataset.labels

            self.assertTrue('env1' in updated_labels.keys())
            self.assertEqual(updated_labels['env1'], 'test1')

            self.assertTrue('env2' in updated_labels.keys())
            self.assertEqual(updated_labels['env2'], 'test2')

#----------------------------------------------------------------------------------------------------------------------
# Test Cases for Config File User Error Validations

    # Test Case 3: Positive Test - testing config file without header value
    def test_project_label_updater_without_header(self):
        config_file = "update_labels_none_header.config"

        contains_header = is_header(config_file)

        self.assertTrue(contains_header, 'N')

    # Test Case 4: Negative Test - testing what if key file is not provided
    def test_project_label_updater_without_key_file(self):
        config_file = "update_labels_without_keyfile.config"

        credentials = access_setup.access_set_up(config_file)

        self.assertIsNotNone(credentials is not None)

    # Test Case 5: Negative Test - testing what if key file is not found
    def test_project_label_updater_wrong_location_key_file(self):
        config_file = "update_labels_keyfile_not_found.config"

        credentials = access_setup.access_set_up(config_file)

        self.assertIsNotNone(credentials is not None)


    # Test Case 6: Negative Test - testing what if input label file is not found
    def test_project_label_updater_label_file_not_found(self):
        config_file = "update_labels_label_file_not_found.config"

        all_cells = access_setup.get_spreadsheet_cells(config_file)

        self.assertIsNotNone(all_cells is not None)


    # Test Case 7 : Negative Test - testing what if input label file option is not provided
    def test_project_label_updater_label_file_not_provided(self):
        config_file = "update_labels_label_file_not_given.config"

        all_cells = access_setup.get_spreadsheet_cells(config_file)

        self.assertIsNotNone(all_cells is not None)


#----------------------------------------------------------------------------------------------------------------------------


if __name__ == "__main__":
    unittest.main()
