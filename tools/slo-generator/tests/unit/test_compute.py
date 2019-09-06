import json
import os
import unittest
import mock
import string
import time
from google.cloud.monitoring_v3.proto import metric_service_pb2

from google.cloud import monitoring_v3
from slo_generator.exporters.bigquery import BigQueryError

from slo_generator.compute import (
    compute,
    export,
    make_reports,
    make_measurement)

from slo_generator.exporters.pubsub import PubsubExporter

cwd = os.path.dirname(os.path.abspath(__file__))

FIXTURES_CONFIG = {
    'PUBSUB_PROJECT_ID': 'fake',
    'PUBSUB_TOPIC_NAME': 'fake',
    'STACKDRIVER_HOST_PROJECT': 'fake',
    'STACKDRIVER_METRIC_PROJECT': 'fake',
    'BIGQUERY_HOST_PROJECT': 'fake',
    'BIGQUERY_TABLE_ID': 'fake',
    'BIGQUERY_DATASET_ID': 'fake',
    'BIGQUERY_TABLE_NAME': 'fake'
}

class MultiCallableStub(object):
    """Stub for the grpc.UnaryUnaryMultiCallable interface."""

    def __init__(self, method, channel_stub):
        self.method = method
        self.channel_stub = channel_stub

    def __call__(self, request, timeout=None, metadata=None, credentials=None):
        self.channel_stub.requests.append((self.method, request))

        response = None
        if self.channel_stub.responses:
            response = self.channel_stub.responses.pop()

        if isinstance(response, Exception):
            raise response

        if response:
            return response

class ChannelStub(object):
    """Stub for the grpc.Channel interface."""

    def __init__(self, responses=[]):
        self.responses = responses
        self.requests = []

    def unary_unary(self, method, request_serializer=None, response_deserializer=None):
        return MultiCallableStub(method, self)

class TestCompute(unittest.TestCase):

    def load_fixture(self, filename, load_json=False, **kwargs):
        with open(filename) as f:
            data = f.read()
        if kwargs:
            data = string.Template(data).substitute(**kwargs)
        if load_json:
            data = json.loads(data)
        return data

    def make_grpc_stub(self, nresp=1):
        next_page_token = ""
        time_series_element = self.load_fixture(
            filename=f"{cwd}/fixtures/time_series_proto.json",
            load_json=True)
        time_series = [time_series_element]
        expected_response = {
            "next_page_token": next_page_token,
            "time_series": time_series,
        }
        expected_response = metric_service_pb2.ListTimeSeriesResponse(
            **expected_response
        )
        channel = ChannelStub(responses=[expected_response] * nresp)
        return channel

    def setUp(self):
        self.slo_config = self.load_fixture(
            filename=f'{cwd}/fixtures/slo_linear.json',
            load_json=True,
            **FIXTURES_CONFIG
        )
        self.slo_config_exp = self.load_fixture(
            filename=f'{cwd}/fixtures/slo_exponential.json',
            load_json=True,
            **FIXTURES_CONFIG
        )
        self.error_budget_policy = self.load_fixture(
            filename=f'{cwd}/fixtures/error_budget_policy.json',
            load_json=True
        )
        self.data = self.load_fixture(
            filename=f'{cwd}/fixtures/slo_report.json',
            load_json=True
        )
        self.timestamp = time.time()
        self.good_event_count = 99
        self.bad_event_count = 1
        self.exporters = self.slo_config['exporters']


    def _get_window(self):
        import time
        timestamp = time.time()
        window = 1000
        measurement_window = monitoring_v3.types.TimeInterval()
        measurement_window.end_time.seconds = int(timestamp)
        measurement_window.end_time.nanos = int(
            (timestamp - measurement_window.end_time.seconds) * 10**9)
        measurement_window.start_time.seconds = int(timestamp - window)
        measurement_window.start_time.nanos = measurement_window.end_time.nanos
        return measurement_window


    def _get_aggregation(self):
        """Helper for aggregation object.

        Default aggregation is `ALIGN_SUM`.
        Default reducer is `REDUCE_SUM`.

        Args:
            window (int): Window size (in seconds).
            aligner (str): Aligner type.
            reducer (str): Reducer type.

        Returns:
            :obj:`monitoring_v3.types.Aggregation`: Aggregation object.
        """
        window = 1000
        aligner = 'ALIGN_SUM'
        reducer = 'REDUCE_SUM'
        aggregation = monitoring_v3.types.Aggregation()
        aggregation.alignment_period.seconds = window
        aggregation.per_series_aligner = (
            getattr(monitoring_v3.enums.Aggregation.Aligner, aligner))
        aggregation.cross_series_reducer = (
            getattr(monitoring_v3.enums.Aggregation.Reducer, reducer))
        return aggregation

    def test_compute_linear(self):
        channel = self.make_grpc_stub(nresp=2*len(self.error_budget_policy))
        patch = mock.patch("google.api_core.grpc_helpers.create_channel")
        with patch as create_channel:
            create_channel.return_value = channel
            data = compute(self.slo_config, self.error_budget_policy)

    def test_compute_exponential(self):
        channel = self.make_grpc_stub(nresp=2*len(self.error_budget_policy))
        patch = mock.patch("google.api_core.grpc_helpers.create_channel")
        with patch as create_channel:
            create_channel.return_value = channel
            data = compute(self.slo_config_exp, self.error_budget_policy)

    @mock.patch("google.cloud.pubsub_v1.gapic.publisher_client.PublisherClient.publish")
    @mock.patch("google.cloud.pubsub_v1.publisher.futures.Future.result")
    def test_export_pubsub(self, mock_pubsub, mock_pubsub_res):
            with mock_pubsub, mock_pubsub_res, self.assertLogs(level='DEBUG') as log:
                export(self.data, self.exporters[0])
            self.assertEqual(len(log.output), 6)
            self.assertEqual(len(log.records), 6)

    def test_export_stackdriver(self):
        with self.assertLogs(level='DEBUG') as log:
            channel = self.make_grpc_stub()
            patch = mock.patch("google.api_core.grpc_helpers.create_channel")
            with patch as create_channel:
                create_channel.return_value = channel
                export(self.data, self.exporters[1])
            self.assertEqual(len(log.output), 6)
            self.assertEqual(len(log.records), 6)

    @mock.patch("google.cloud.bigquery.Client.get_table")
    @mock.patch("google.cloud.bigquery.Client.create_table")
    @mock.patch("google.cloud.bigquery.Client.insert_rows_json")
    def test_export_bigquery(self, mock_bq, mock_bq_2, mock_bq_3):
        with mock_bq, mock_bq_2, mock_bq_3, self.assertLogs(level='DEBUG') as log:
            mock_bq.return_value = []
            export(self.data, self.exporters[2])
            self.assertEqual(len(log.output), 6)
            self.assertEqual(len(log.records), 6)

    @mock.patch("google.cloud.bigquery.Client.get_table")
    @mock.patch("google.cloud.bigquery.Client.create_table")
    @mock.patch("google.cloud.bigquery.Client.insert_rows_json")
    def test_export_bigquery_error(self, mock_bq, mock_bq_2, mock_bq_3):
        with mock_bq, mock_bq_2, mock_bq_3, self.assertLogs(level='DEBUG') as log:
            mock_bq.return_value = [
                {
                    'errors': [
                        {
                            "location": "us-east1",
                            "debugInfo": "This is some debug info",
                            "message": "This is a test exception",
                            "reason": "You're running a test suite",
                        }
                    ]
                }
            ]
            with self.assertRaises(BigQueryError):
                export(self.data, self.exporters[2])
            self.assertEqual(len(log.output), 5)
            self.assertEqual(len(log.records), 5)

    def test_make_reports(self):
        s1 = make_reports(
            self.slo_config,
            self.error_budget_policy,
            self.timestamp)
        pass

    def test_make_measurement(self):
        s1 = make_measurement(
            self.slo_config,
            self.error_budget_policy[0],
            self.good_event_count,
            self.bad_event_count,
            self.timestamp
        )
        pass

if __name__ == '__main__':
    unittest.main()
