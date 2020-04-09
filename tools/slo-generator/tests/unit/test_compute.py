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
import warnings

from elasticsearch import Elasticsearch
from google.auth._default import _CLOUD_SDK_CREDENTIALS_WARNING
from mock import patch, MagicMock
from prometheus_http_client import Prometheus
from slo_generator.exporters.bigquery import BigQueryError
from slo_generator.compute import compute, export
from test_stubs import (CTX, load_fixture, load_sample, load_slo_samples,
                        mock_sd, mock_prom, mock_es, mock_ssm_client)

warnings.filterwarnings("ignore", message=_CLOUD_SDK_CREDENTIALS_WARNING)

ERROR_BUDGET_POLICY = load_sample('error_budget_policy.yaml', **CTX)
STEPS = len(ERROR_BUDGET_POLICY)
SLO_CONFIGS_SD = load_slo_samples('stackdriver', **CTX)
SLO_CONFIGS_SDSM = load_slo_samples('stackdriver_service_monitoring', **CTX)
SLO_CONFIGS_PROM = load_slo_samples('prometheus', **CTX)
SLO_CONFIGS_ES = load_slo_samples('elasticsearch', **CTX)
SLO_REPORT = load_fixture('slo_report.json')
EXPORTERS = load_fixture('exporters.yaml', **CTX)
BQ_ERROR = load_fixture('bq_error.json')

# Pub/Sub methods to patch
PUBSUB_MOCKS = [
    "google.cloud.pubsub_v1.gapic.publisher_client.PublisherClient.publish",
    "google.cloud.pubsub_v1.publisher.futures.Future.result"
]

# Service Monitoring method to patch
# pylint: ignore=E501
SSM_MOCKS = [
    "slo_generator.backends.stackdriver_service_monitoring.ServiceMonitoringServiceClient",  # noqa: E501
    "slo_generator.backends.stackdriver_service_monitoring.SSM.to_json"
]


class TestCompute(unittest.TestCase):

    @patch('google.api_core.grpc_helpers.create_channel',
           return_value=mock_sd(2 * STEPS * len(SLO_CONFIGS_SD)))
    def test_compute_stackdriver(self, mock):
        for config in SLO_CONFIGS_SD:
            with self.subTest(config=config):
                compute(config, ERROR_BUDGET_POLICY)

    @patch(SSM_MOCKS[0], return_value=mock_ssm_client())
    @patch(SSM_MOCKS[1],
           return_value=MagicMock(side_effect=mock_ssm_client.to_json))
    @patch('google.api_core.grpc_helpers.create_channel',
           return_value=mock_sd(2 * STEPS * len(SLO_CONFIGS_SDSM)))
    def test_compute_ssm(self, *mocks):
        for config in SLO_CONFIGS_SDSM:
            with self.subTest(config=config):
                compute(config, ERROR_BUDGET_POLICY)

    @patch(SSM_MOCKS[0], return_value=mock_ssm_client())
    @patch(SSM_MOCKS[1],
           return_value=MagicMock(side_effect=mock_ssm_client.to_json))
    @patch('google.api_core.grpc_helpers.create_channel',
           return_value=mock_sd(2 * STEPS * len(SLO_CONFIGS_SDSM)))
    @patch(PUBSUB_MOCKS[0])
    @patch(PUBSUB_MOCKS[1])
    def test_compute_ssm_delete_export(self, *mocks):
        for config in SLO_CONFIGS_SDSM:
            with self.subTest(config=config):
                compute(config,
                        ERROR_BUDGET_POLICY,
                        delete=True,
                        do_export=True)

    @patch.object(Prometheus, 'query', mock_prom)
    def test_compute_prometheus(self):
        for config in SLO_CONFIGS_PROM:
            with self.subTest(config=config):
                compute(config, ERROR_BUDGET_POLICY)

    @patch.object(Elasticsearch, 'search', mock_es)
    def test_compute_elasticsearch(self):
        for config in SLO_CONFIGS_ES:
            with self.subTest(config=config):
                compute(config, ERROR_BUDGET_POLICY)

    @patch(PUBSUB_MOCKS[0])
    @patch(PUBSUB_MOCKS[1])
    def test_export_pubsub(self, mock_pubsub, mock_pubsub_res):
        export(SLO_REPORT, EXPORTERS[0])

    @patch("google.api_core.grpc_helpers.create_channel",
           return_value=mock_sd(STEPS))
    def test_export_stackdriver(self, mock):
        export(SLO_REPORT, EXPORTERS[1])

    @patch("google.cloud.bigquery.Client.get_table")
    @patch("google.cloud.bigquery.Client.create_table")
    @patch("google.cloud.bigquery.Client.insert_rows_json", return_value=[])
    def test_export_bigquery(self, mock_bq, mock_bq_2, mock_bq_3):
        export(SLO_REPORT, EXPORTERS[2])

    @patch("google.cloud.bigquery.Client.get_table")
    @patch("google.cloud.bigquery.Client.create_table")
    @patch("google.cloud.bigquery.Client.insert_rows_json",
           return_value=BQ_ERROR)
    def test_export_bigquery_error(self, mock_bq, mock_bq_2, mock_bq_3):
        with self.assertRaises(BigQueryError):
            export(SLO_REPORT, EXPORTERS[2])

    @patch("prometheus_client.push_to_gateway")
    def test_export_prometheus(self, mock):
        export(SLO_REPORT, EXPORTERS[3])


if __name__ == '__main__':
    unittest.main()
