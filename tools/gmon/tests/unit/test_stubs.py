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
import os
import re
import yaml

from google.api import metric_pb2
from google.cloud.monitoring_v3 import types

TEST_DIR = os.path.dirname(os.path.abspath(__file__))


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


def mock_grpc_response(response, proto_method):
    """Fakes gRPC response channel for the proto_method passed.

    Args:
        response (dict): Expected response.

    Returns:
        dict: Expected response.
    """
    return proto_method(**response)


def mock_grpc_stub(data):
    """Fakes gRPC response channel for the proto_method passed.

    Args:
        data (list): List of responses to fake.

    Returns:
        ChannelStub: Mocked gRPC channel stub.
    """
    responses = []
    for item in data:
        response = item['response']
        proto_method = item['proto_method']
        expected_response = mock_grpc_response(response, proto_method)
        responses.append(expected_response)
    channel = ChannelStub(responses=responses)
    return channel


def mock_cm_list_metric_descriptors():
    metric_descriptor = load_fixture('metric_descriptor_proto.json')
    data = [{
        'response': {
            'next_page_token': '',
            'metric_descriptors': [metric_descriptor]
        },
        'proto_method': types.ListMetricDescriptorsResponse
    }]
    return mock_grpc_stub(data)


def mock_cm_get_metric_descriptors():
    metric_descriptor = load_fixture('metric_descriptor_proto.json')
    data = [{
        'response': metric_descriptor,
        'proto_method': metric_pb2.MetricDescriptor
    }]
    return mock_grpc_stub(data)


def mock_cm_inspect_metric_descriptors():
    metric_descriptor = load_fixture('metric_descriptor_proto.json')
    timeseries = load_fixture('time_series_proto.json')
    data = [{
        'response': {
            'next_page_token': '',
            'time_series': [timeseries]
        },
        'proto_method': types.ListTimeSeriesResponse
    }, {
        'response': metric_descriptor,
        'proto_method': metric_pb2.MetricDescriptor
    }]
    return mock_grpc_stub(data)


def mock_cm_list_services():
    service = load_fixture('ssm_service_proto.json')
    data = [{
        'response': {
            'next_page_token': '',
            'services': [service]
        },
        'proto_method': types.ListServicesResponse
    }]
    return mock_grpc_stub(data)


def mock_cm_list_slos():
    slo = load_fixture('ssm_slo_proto.json')
    data = [{
        'response': {
            'next_page_token': '',
            'service_level_objectives': [slo]
        },
        'proto_method':
            types.ListServiceLevelObjectivesResponse  # noqa: E501
    }]
    return mock_grpc_stub(data)


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


def parse_config(path, ctx=os.environ):
    """Load a yaml / json configuration file and resolve environment variables
    in it.

    Args:
        path (str): the path to the yaml file.
        ctx (dict): Context to replace env variables from (defaults to
            `os.environ`).

    Returns:
        dict: Parsed YAML dictionary.
    """
    pattern = re.compile(r'.*?\${(\w+)}.*?')

    def replace_env_vars(content, ctx):
        """Replace env variables in content from context.

        Args:
            content (str): String to parse.
            ctx (dict): Context to replace vars from.

        Returns:
            str: the parsed string with the env var replaced.
        """
        match = pattern.findall(content)
        if match:
            full_value = content
            for var in match:
                try:
                    full_value = full_value.replace(f'${{{var}}}', ctx[var])
                except KeyError as exception:
                    raise exception
            content = full_value
        return content

    with open(path) as config:
        content = config.read()
        content = replace_env_vars(content, ctx)
        data = yaml.safe_load(content)
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
