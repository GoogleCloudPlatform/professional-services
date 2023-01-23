# -*- coding: utf-8 -*-

# Copyright 2023 Google LLC
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#        http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.

import json
import pytest
import toml

from click.testing import CliRunner
from datetime import datetime, timedelta, timezone
from unittest import mock

from google.cloud.monitoring_v3 import (
    QueryServiceClient,
    QueryTimeSeriesRequest,
    QueryTimeSeriesResponse)

from google.cloud.monitoring_v3.services.query_service.pagers import QueryTimeSeriesPager

from google.api_core.gapic_v1.method import _GapicCallable
from google.api_core.exceptions import InvalidArgument, ServiceUnavailable

import capacity_planner

from capacity_planner import MetricNotFoundError, QueryParsingError


@pytest.fixture(autouse=True)
def project_id():
    return 'my-awesome-project'


@pytest.fixture(autouse=True)
def spring_client(project_id):
    client = capacity_planner.CapacityPlanner(project_id)

    return client


@pytest.fixture
def mock_query_service_client(monkeypatch):
    mock_client = mock.create_autospec(QueryServiceClient)
    mock_client.return_value = mock_client

    return mock_client


@pytest.fixture
def mock_query_time_series_pager(monkeypatch):
    mock_pager = mock.create_autospec(QueryTimeSeriesPager)
    mock_pager.return_value = mock_pager

    return mock_pager


@pytest.fixture
def mock_gapic_callable(monkeypatch):
    mock_callable = mock.create_autospec(_GapicCallable)
    mock_callable.return_value = mock_callable

    return mock_callable


@pytest.fixture
def tz_jst():
    tz_jst = timezone(timedelta(hours=9))

    return tz_jst


@pytest.fixture
def end_time(tz_jst):
    end_time = datetime(2022, 12, 9, 12, 34, 56, tzinfo=tz_jst)

    return end_time


@pytest.fixture
def duration_minutes():
    duration_minutes = 180

    return duration_minutes


@pytest.fixture
def lb_qps_query():
    query = """fetch https_lb_rule
        | metric 'loadbalancing.googleapis.com/https/request_count'
        | align rate(1m)
        | every 1m
        | group_by [resource.region], [value_requst_count_aggregate: aggregate(value.request_count)]"""  # noqa: E501

    return query


@pytest.fixture
def lb_qps_query_clean():
    query = "fetch https_lb_rule | metric 'loadbalancing.googleapis.com/https/request_count' | align rate(1m) | every 1m | group_by [resource.region], [value_requst_count_aggregate: aggregate(value.request_count)]"  # noqa: E501

    return query


@pytest.fixture(scope='module')
def click_runner():
    return CliRunner()


def test_spring_object_initialization(spring_client, project_id):
    """Test if CapacityPlanner object has appropriate variables."""
    assert isinstance(spring_client._qsc, QueryServiceClient) is True
    assert spring_client._project_id == project_id


def test_clean_query(spring_client, lb_qps_query, lb_qps_query_clean):
    """Test if clean_query produce the correct result."""
    result = spring_client._clean_query(lb_qps_query)
    assert result == lb_qps_query_clean


def test_build_within_filter(spring_client, end_time, duration_minutes):
    expected = "| within 180m, d'2022/12/09 12:34:56+0900'"
    result = spring_client._build_within_filter(end_time, duration_minutes)
    assert result == expected


def test_query_mql(monkeypatch, project_id, lb_qps_query_clean, mock_query_service_client, spring_client, lb_qps_query, tz_jst, end_time, duration_minutes):
    monkeypatch.setattr(spring_client, '_qsc', mock_query_service_client)

    _ = spring_client.query_mql(
        lb_qps_query, tz_jst, end_time, duration_minutes)
    project_name = f"projects/{project_id}"
    query = lb_qps_query_clean + "| within 180m, d'2022/12/09 12:34:56+0900'"
    expected_request = QueryTimeSeriesRequest(name=project_name, query=query)
    mock_query_service_client.query_time_series.assert_called_once_with(
        request=expected_request)


def test_query_mql_value_error(monkeypatch, project_id, lb_qps_query_clean, mock_query_service_client, spring_client, lb_qps_query, tz_jst, end_time, duration_minutes):
    monkeypatch.setattr(spring_client, '_qsc', mock_query_service_client)
    spring_client._qsc.query_time_series.side_effect = ValueError()
    with pytest.raises(MetricNotFoundError):
        _ = spring_client.query_mql(
            lb_qps_query, tz_jst, end_time, duration_minutes)


def test_query_mql_type_error(monkeypatch, project_id, lb_qps_query_clean, mock_query_service_client, spring_client, lb_qps_query, tz_jst, end_time, duration_minutes):
    monkeypatch.setattr(spring_client, '_qsc', mock_query_service_client)
    spring_client._qsc.query_time_series.side_effect = TypeError()
    with pytest.raises(MetricNotFoundError):
        _ = spring_client.query_mql(
            lb_qps_query, tz_jst, end_time, duration_minutes)


def test_query_mql_invalid_argument_error(monkeypatch, project_id, lb_qps_query_clean, mock_query_service_client, spring_client, lb_qps_query, tz_jst, end_time, duration_minutes):
    monkeypatch.setattr(spring_client, '_qsc', mock_query_service_client)
    spring_client._qsc.query_time_series.side_effect = InvalidArgument(
        "Invalid")
    with pytest.raises(QueryParsingError):
        _ = spring_client.query_mql(
            lb_qps_query, tz_jst, end_time, duration_minutes)


def test_query_mql_service_unavailable_error(monkeypatch, project_id, lb_qps_query_clean, mock_query_service_client, spring_client, lb_qps_query, tz_jst, end_time, duration_minutes):
    monkeypatch.setattr(spring_client, '_qsc', mock_query_service_client)
    spring_client._qsc.query_time_series.side_effect = ServiceUnavailable(
        "503")
    with pytest.raises(ServiceUnavailable):
        _ = spring_client.query_mql(
            lb_qps_query, tz_jst, end_time, duration_minutes)


def test_build_dataframe(monkeypatch, mock_gapic_callable, spring_client, mock_query_service_client, tz_jst):
    monkeypatch.setattr(spring_client, '_qsc', mock_query_service_client)

    # load query result data
    with open('tests/dump.json', 'r') as f:
        data = json.load(f)

    data_metadata = data['metadata']
    data_request = QueryTimeSeriesRequest.from_json(
        json.dumps(data['request']))
    data_response = QueryTimeSeriesResponse.from_json(
        json.dumps(data['response']))

    query_result = QueryTimeSeriesPager(
        method=mock_gapic_callable, request=data_request, response=data_response, metadata=data_metadata)

    result = spring_client._build_dataframe(query_result, tz_jst)

    assert result.shape == (180, 1)
    assert result.columns.names == ['resource.region', 'unit']
    assert result.columns.name is None


def test_build_dataframe_with_label(monkeypatch, mock_gapic_callable, spring_client, mock_query_service_client, tz_jst):
    monkeypatch.setattr(spring_client, '_qsc', mock_query_service_client)

    # load query result data
    with open('tests/dump.json', 'r') as f:
        data = json.load(f)

    data_metadata = data['metadata']
    data_request = QueryTimeSeriesRequest.from_json(
        json.dumps(data['request']))
    data_response = QueryTimeSeriesResponse.from_json(
        json.dumps(data['response']))

    query_result = QueryTimeSeriesPager(
        method=mock_gapic_callable, request=data_request, response=data_response, metadata=data_metadata)

    result = spring_client._build_dataframe(query_result, tz_jst, label="test")

    assert result.shape == (180, 1)
    assert result.columns.name is None


def test_build_dataframe_with_both_label_and_labels(monkeypatch, spring_client, mock_query_service_client, mock_query_time_series_pager, tz_jst):
    monkeypatch.setattr(spring_client, '_qsc', mock_query_service_client)
    query_result = mock_query_time_series_pager
    with pytest.raises(ValueError):
        _ = spring_client._build_dataframe(
            query_result, tz_jst, label="test", labels=["a", "b"])


def test_load_queries(monkeypatch, spring_client, mock_query_service_client):
    monkeypatch.setattr(spring_client, '_qsc', mock_query_service_client)

    with open('queries.toml', 'r') as f:
        toml_data = toml.load(f)

    for product_name, metric_name, query in spring_client.load_queries():
        found = False
        # find key for the product_name first
        for k, v in toml_data.items():
            if v['product_name'] == product_name:
                for item in v.values():
                    if isinstance(item, dict):
                        if item['metric_name'] == metric_name and item['query'] == query:
                            found = True
        assert found == True


def test_sort_columns(monkeypatch, spring_client, mock_query_service_client):
    monkeypatch.setattr(spring_client, '_qsc', mock_query_service_client)

    columns = [
        ('product_name', None),
        ('metrics', 'resource.region'),
        ('metrics', 'unit'),
        ('metric_name', None),
        ('value', None),
        ('time', None),
        ('metrics', 'resource.subscription_id')]

    expected = [
        ('product_name', None),
        ('metric_name', None),
        ('metrics', 'resource.region'),
        ('metrics', 'unit'),
        ('metrics', 'resource.subscription_id'),
        ('value', None),
        ('time', None)]

    result = spring_client._sort_columns(columns)

    assert result == expected


def test_query_as_dataframe_with_dumped_data(monkeypatch, spring_client, mock_query_service_client, mock_gapic_callable, lb_qps_query, tz_jst, end_time, duration_minutes):
    monkeypatch.setattr(spring_client, '_qsc', mock_query_service_client)

    # load query result data
    with open('tests/dump.json', 'r') as f:
        data = json.load(f)

    data_metadata = data['metadata']
    data_request = QueryTimeSeriesRequest.from_json(
        json.dumps(data['request']))
    data_response = QueryTimeSeriesResponse.from_json(
        json.dumps(data['response']))

    query_result = QueryTimeSeriesPager(
        method=mock_gapic_callable, request=data_request, response=data_response, metadata=data_metadata)

    def query_time_series(request):
        return query_result

    spring_client._qsc.query_time_series.side_effect = query_time_series

    def load_queries():
        yield 'HTTP(S) Load Balancing', 'QPS', lb_qps_query

    spring_client.load_queries = load_queries

    result = spring_client.query_as_dataframe(
        tz_jst, end_time, duration_minutes)

    assert result.shape == (1, 6)
    assert result.columns.name is None


def test_query_as_dataframe_with_empty_data(monkeypatch, spring_client, mock_query_service_client, mock_gapic_callable, lb_qps_query, tz_jst, end_time, duration_minutes):
    monkeypatch.setattr(spring_client, '_qsc', mock_query_service_client)

    def load_queries():
        yield 'HTTP(S) Load Balancing', 'QPS', lb_qps_query

    spring_client.load_queries = load_queries

    def empty(query, tz, end_time, duration_minutes):
        return None

    spring_client.query_mql = empty

    result = spring_client.query_as_dataframe(
        tz_jst, end_time, duration_minutes)

    assert result.empty


def test_main(monkeypatch, spring_client, mock_query_service_client, project_id, end_time, duration_minutes, click_runner, tz_jst):
    mock_spring = mock.create_autospec(capacity_planner.CapacityPlanner)
    monkeypatch.setattr(capacity_planner, 'CapacityPlanner', mock_spring)

    result = click_runner.invoke(capacity_planner.main, [
                                 '--project_id', project_id, '--duration_minutes', duration_minutes])

    assert result.exit_code == 0
