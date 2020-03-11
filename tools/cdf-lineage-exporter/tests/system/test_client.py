# Copyright 2020 Google LLC
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#     https://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.

import os

import pytest

ENV_VAR_CDAP_ENDPOINT = "CDAP_ENDPOINT"
DEFAULT_CDAP_ENDPOINT = (
    #"http://localhost:11015"
    "https://private-cdf-jferriero-dev-dot-usc1.datafusion.googleusercontent.com/api"
)


@pytest.fixture
def cdap_endpoint():
    return os.getenv(ENV_VAR_CDAP_ENDPOINT, DEFAULT_CDAP_ENDPOINT)


@pytest.fixture
def module_under_test():
    import cdap.client

    return cdap.client


@pytest.fixture
def object_under_test(module_under_test, cdap_endpoint):
    credentials = module_under_test.DEFAULT_CREDENTIALS
    if cdap_endpoint.startswith("http://localhost"):
        credentials = None
    return module_under_test.CDAPClient(credentials=credentials,
                                        api_endpoint=cdap_endpoint)


def test_list_namespaces(object_under_test):
    assert object_under_test.list_namespaces()


def test_list_apps(object_under_test):
    assert object_under_test.list_apps()


def test_list_datasets(object_under_test):
    assert object_under_test.list_datasets()


def test_list_streams(object_under_test):
    # Streams are deprecated, so no return value is expected.
    # https://docs.cask.co/cdap/develop/en/developer-manual/building-blocks/streams.html
    assert object_under_test.list_streams() == []


def test_list_lineage(object_under_test):
    assert object_under_test.list_lineage("datasets", "NYT_BestSellers_Raw")
