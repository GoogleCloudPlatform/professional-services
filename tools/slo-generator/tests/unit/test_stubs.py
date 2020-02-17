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
"""stubs.py

Stubs for mocking backends and exporters.
"""
import json
import os

from google.cloud.monitoring_v3.proto import metric_service_pb2

from slo_generator.utils import parse_config, list_slo_configs

TEST_DIR = os.path.dirname(os.path.abspath(__file__))
SAMPLE_DIR = os.path.join(os.path.dirname(os.path.dirname(TEST_DIR)),
                          "samples/")

CTX = {
    'PUBSUB_PROJECT_ID': 'fake',
    'PUBSUB_TOPIC_NAME': 'fake',
    'GAE_PROJECT_ID': 'fake',
    'GAE_MODULE_ID': 'fake',
    'GKE_MESH_UID': 'fake',
    'GKE_PROJECT_ID': 'fake',
    'GKE_CLUSTER_NAME': 'fake',
    'GKE_LOCATION': 'fake',
    'GKE_SERVICE_NAMESPACE': 'fake',
    'GKE_SERVICE_NAME': 'fake',
    'LB_PROJECT_ID': 'fake',
    'PROMETHEUS_URL': 'http://localhost:9090',
    'PROMETHEUS_PUSHGATEWAY_URL': 'http://localhost:9091',
    'ELASTICSEARCH_URL': 'http://localhost:9200',
    'STACKDRIVER_HOST_PROJECT_ID': 'fake',
    'STACKDRIVER_LOG_METRIC_NAME': 'fake',
    'BIGQUERY_PROJECT_ID': 'fake',
    'BIGQUERY_TABLE_ID': 'fake',
    'BIGQUERY_DATASET_ID': 'fake',
    'BIGQUERY_TABLE_NAME': 'fake'
}


# pylint: disable=too-few-public-methods
class MultiCallableStub:
    """Stub for the grpc.UnaryUnaryMultiCallable interface."""

    def __init__(self, method, channel_stub):
        self.method = method
        self.channel_stub = channel_stub

    # pylint: disable=inconsistent-return-statements
    def __call__(self, request, timeout=None, metadata=None, credentials=None):
        self.channel_stub.requests.append((self.method, request))

        response = None
        if self.channel_stub.responses:
            response = self.channel_stub.responses.pop()

        if isinstance(response, Exception):
            raise response

        if response:
            return response


# pylint: disable=R0903
class ChannelStub:
    """Stub for the grpc.Channel interface."""

    def __init__(self, responses=[]):
        self.responses = responses
        self.requests = []

    # pylint: disable=C0116,W0613
    def unary_unary(self,
                    method,
                    request_serializer=None,
                    response_deserializer=None):
        return MultiCallableStub(method, self)


def mock_grpc_stub(response, proto_method, nresp=1):
    """Fakes gRPC response channel for the proto_method passed.

    Args:
        response (dict): Expected response.
        nresp (int): Number of expected responses.

    Returns:
        ChannelStub: Mocked gRPC channel stub.
    """
    expected_response = proto_method(**response)
    channel = ChannelStub(responses=[expected_response] * nresp)
    return channel


def mock_sd(nresp=1):
    """Fake Stackdriver Monitoring API response for the ListTimeSeries endpoint.

    Args:
        nresp (int): Number of responses to add to response.

    Returns:
        ChannelStub: Mocked gRPC channel stub.
    """
    timeserie = load_fixture('time_series_proto.json')
    response = {"next_page_token": "", "time_series": [timeserie]}
    return mock_grpc_stub(
        response=response,
        proto_method=metric_service_pb2.ListTimeSeriesResponse,
        nresp=nresp)


# pylint: disable=W0613,R1721
def mock_prom(self, metric):
    """Fake Prometheus query response.

    Args:
        metric (dict): Input metric query.

    Returns:
        dict: Fake response.
    """
    data = {
        'data': {
            'result': [{
                'values': [x for x in range(5)],
                'value': [0, 1]
            }]
        }
    }
    return json.dumps(data)


# pylint: disable=W0613
def mock_es(self, index, body):
    """Fake ElasticSearch response.

    Args:
        index (str): Index.
        body (dict): Query body.

    Returns:
        dict: Fake response.
    """
    return {'hits': {'total': {'value': 120}}}


class dotdict(dict):
    """dot.notation access to dictionary attributes"""
    __getattr__ = dict.get
    __setattr__ = dict.__setitem__
    __delattr__ = dict.__delitem__


def dotize(data):
    """Transform dict to class instance with attribute access.

    Args:
        data (dict): Input dict.

    Returns:
        dotdict: Dotdict equivalent.
    """
    data = dotdict(data)
    for k, v in data.items():
        if isinstance(v, dict):
            data[k] = dotdict(v)
    return data


class mock_ssm_client:
    """Fake Service Monitoring API client."""

    def __init__(self):
        self.services = [dotize(s) for s in load_fixture('ssm_services.json')]
        self.service_level_objectives = [
            dotize(slo) for slo in load_fixture('ssm_slos.json')
        ]

    def project_path(self, project_id):
        return f'projects/{project_id}'

    def service_path(self, project_id, service_id):
        project_path = self.project_path(project_id)
        return f'{project_path}/services/{service_id}'

    def create_service(self, parent, service, service_id=None):
        return self.services[0]

    def list_services(self, parent):
        return self.services

    def delete_service(self, name):
        return None

    def create_service_level_objective(self,
                                       parent,
                                       service_level_objective,
                                       service_level_objective_id=None):
        return self.service_level_objectives[0]

    def update_service_level_objective(self, service_level_objective):
        return self.service_level_objectives[0]

    def list_service_level_objectives(self, parent):
        return self.service_level_objectives

    def delete_service_level_objective(self, name):
        return None

    @staticmethod
    def to_json(data):
        return data


def load_fixture(filename, **ctx):
    """Load a fixture from the test/fixtures/ directory and replace context
    environmental variables in it.

    Args:
        filename (str): Filename of the fixture to load.
        ctx (dict): Context dictionary (env variables).

    Returns:
        dict: Loaded fixture.
    """
    filename = os.path.join(TEST_DIR, "fixtures/", filename)
    return parse_config(filename, ctx)


def load_sample(filename, **ctx):
    """Load a sample from the samples/ directory and replace context
    environmental variables in it.

    Args:
        filename (str): Filename of the fixture to load.
        ctx (dict): Context dictionary (env variables).

    Returns:
        dict: Loaded sample.
    """
    filename = os.path.join(SAMPLE_DIR, filename)
    return parse_config(filename, ctx)


def load_slo_samples(folder_path, **ctx):
    """List and load all SLO samples from folder path.

    Args:
        folder_path (str): Folder path to load SLO configs from.
        ctx (dict): Context for env variables.

    Returns:
        list: List of loaded SLO configs.
    """
    return [
        load_sample(filename, **ctx)
        for filename in list_slo_configs(f'{SAMPLE_DIR}/{folder_path}')
    ]
