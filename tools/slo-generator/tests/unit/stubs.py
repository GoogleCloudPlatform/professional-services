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

import json
import os

from google.cloud.monitoring_v3.proto import metric_service_pb2

from slo_generator.utils import parse_config, list_slo_configs

TEST_DIR = os.path.dirname(os.path.abspath(__file__))
SAMPLE_DIR = os.path.join(os.path.dirname(os.path.dirname(TEST_DIR)),
                          "samples/")


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
        stubs.ChannelStub: Mocked gRPC channel stub.
    """
    expected_response = proto_method(**response)
    channel = ChannelStub(responses=[expected_response] * nresp)
    return channel


def mock_grpc_sd(nresp=1):
    """Fake Stackdriver Monitoring API response for the ListTimeSeries endpoint.
    """
    timeserie = load_fixture('time_series_proto.json')
    response = {"next_page_token": "", "time_series": [timeserie]}
    return mock_grpc_stub(
        response=response,
        proto_method=metric_service_pb2.ListTimeSeriesResponse,
        nresp=nresp)


def mock_prom_query(self, metric):
    data = {
        'data': {
            'result': [{
                'values': [x for x in range(5)],
                'value': [0, 1]
            }]
        }
    }
    return json.dumps(data)


def mock_es_search(self, index, body):
    return {'hits': {'total': {'value': 120}}}


#-------------------#
# Utility functions #
#-------------------#
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
