# Copyright 2019 Google LLC
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

import json
import unittest
from unittest.mock import MagicMock
from unittest.mock import PropertyMock
from unittest.mock import patch

from googleapiclient.discovery import build
from googleapiclient.http import HttpMock

from google.oauth2.credentials import Credentials

from gcs_to_gke_configmaps.k8s import GKECluster
from gcs_to_gke_configmaps import setup_logging
from gcs_to_gke_configmaps import cloud_logger


def read_info():
    info_to_return = ""
    with open("tests/data/gke-info-response.json", "r") as f:
        info_to_return = json.load(f)
    return info_to_return

class K8SObjectTest(unittest.TestCase):

    @patch("gcs_to_gke_configmaps.get_credentials")
    @patch("gcs_to_gke_configmaps.get_token")
    @patch('gcs_to_gke_configmaps.k8s.GKECluster.info', new_callable=PropertyMock, return_value=read_info())
    def test_info(self, info_patch, token_patch, crendentials_patch):
        # with patch('gcs_to_gke_configmaps.k8s.GKECluster.info', new_callable=PropertyMock, return_value=read_info()):
            self.gke_cluster = GKECluster("test-cluster", "us-central1", "example-gcp-project")
            self.assertEqual(self.gke_cluster.info['endpoint'], "555.555.555.555")

    @patch("gcs_to_gke_configmaps.get_credentials")
    @patch("gcs_to_gke_configmaps.get_token")
    @patch('gcs_to_gke_configmaps.k8s.GKECluster.info', new_callable=PropertyMock, return_value=read_info())
    def test_id(self, info_patch, token_patch, crendentials_patch):
        with patch('gcs_to_gke_configmaps.k8s.GKECluster.info', new_callable=PropertyMock, return_value=read_info()) as mock_info:
            self.gke_cluster = GKECluster("test-cluster", "us-central1", "example-gcp-project")
            self.assertEqual(self.gke_cluster.id, "projects/example-gcp-project/locations/us-central1/clusters/test-cluster")


        