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

from google.cloud import monitoring_v3

from google.api_core.exceptions import InvalidArgument, ServiceUnavailable

import click
import numpy as np
import pandas as pd
import toml

from typing import Any, Generator, List, Tuple

import datetime
import logging

logging.basicConfig(level=logging.INFO)


class CapacityPlanner(object):
    """Capacity Planner class.

    Attributes:
        _qsc: A `monitoring_v3.QueryServiceClient` object.
        _project_id: A string of Project ID which hosts Cloud Monitoring.

    """

    def __init__(self, project_id: str) -> None:
        self._qsc = monitoring_v3.QueryServiceClient()
        self._project_id = project_id

    def _build_dataframe(self, time_series_pager, tz: datetime.timezone,
                         label=None, labels=None) -> pd.DataFrame:
        if label is not None:
            if labels:
                raise ValueError("Cannot specify both label and labels.")
            labels = (label,)

        columns = []
        headers = []

        for time_series in time_series_pager:
            pandas_series = pd.Series(
                data=[
                    self._extract_value(point.values[0])
                    for point in time_series.point_data],
                index=[
                    point.time_interval.end_time.timestamp_pb().ToNanoseconds()
                    for point in time_series.point_data],
            )
            columns.append(pandas_series)
            headers.append(self._extract_header(time_series))

        # Assemble the columns into a DataFrame.
        df = pd.DataFrame.from_records(columns).T

        # Convert the timestamp strings into a DatetimeIndex.
        df.index = pd.to_datetime(df.index, utc=True).tz_convert(str(tz))

        # Implement a smart default of using all available labels.
        unit = self._extract_unit(time_series_pager)
        if labels is None:
            labels = []
            for header in headers:
                item = [self._extract_label(item) for item in header]
                item.append(unit)
                labels.append(item)

        # Build a column Index or MultiIndex. Do not include level names
        # in the column header if the user requested a single-level header
        # by specifying "label".
        index_names = self._extract_index_names(time_series_pager)
        index_names.append('unit')

        df.columns = pd.MultiIndex.from_tuples(
            labels, names=index_names if not label else None)

        # Sort the rows just in case (since the API doesn't guarantee the
        # ordering), and sort the columns lexicographically.
        return df.sort_index(axis=0).sort_index(axis=1)

    def _build_within_filter(self, end_time: datetime.datetime,
                             duration_minutes: int) -> str:
        """

        Reference:
        - https://cloud.google.com/monitoring/mql/reference#within-tabop
        """
        time_str = end_time.strftime("%Y/%m/%d %H:%M:%S%z")
        filter_str = f"| within {duration_minutes}m, d'{time_str}'"

        return filter_str

    def _clean_query(self, query: str) -> str:
        """Remove newlines and multiple whitespaces."""
        q = ''.join(query.splitlines())
        q = ' '.join(q.split())

        return q

    def _extract_header(self, time_series) -> List[str]:
        return time_series.label_values

    def _extract_index_names(self, time_series_pager) -> List[str]:
        descriptors = time_series_pager._response.time_series_descriptor
        index_names = [
            label_descriptor.key
            for label_descriptor in descriptors.label_descriptors]

        return index_names

    def _extract_label(self, label_value) -> Any:
        value_type = \
            monitoring_v3.LabelValue.pb(label_value).WhichOneof("value")

        return getattr(label_value, value_type)

    def _extract_unit(self, time_series_pager) -> str:
        descriptors = time_series_pager._response.time_series_descriptor
        unit = descriptors.point_descriptors[0].unit

        return unit

    def _extract_value(self, typed_value) -> Any:
        value_type = \
            monitoring_v3.TypedValue.pb(typed_value).WhichOneof("value")

        return getattr(typed_value, value_type)

    def _sort_columns(self, columns: List[Tuple[str, str]]) -> List:
        sorted_columns = []
        leading_column_names = ('product_name', 'metric_name')
        leading_columns = []

        following_columns_names = ('value', 'time')
        following_columns = []

        for item in columns:
            if item[0] in leading_column_names:
                leading_columns.append(item)
            elif item[0] in following_columns_names:
                following_columns.append(item)
            else:
                sorted_columns.append(item)

        return leading_columns + sorted_columns + following_columns

    def find_peak(self, df: pd.DataFrame, product_name: str, metric_name: str
                  ) -> pd.DataFrame:
        """Find peak and its timestamp from the given dataframe.

        Aiming to produce the final dataframe as shown below.

        | product_name | region | country | ... | metric_name | value | time  |
        | ------------ | ------ | ------- | --- | ----------- | ----- | ----- |
        | L7XLB        | global | Japan   | ... | QPS         | 58.7  | 17:17 |
        | L7XLB        | global | UK      | ... | QPS         | 23.5  | 17:18 |
        | ...

        """
        column_names = [("product_name",)] \
            + [('metrics', name) for name in df.columns.names] \
            + [("metric_name",), ("value",), ("time",)]
        columns = pd.MultiIndex.from_tuples(column_names)
        rows = []
        for column_name, column_data in df.items():
            row = [product_name] \
                + list(column_name) \
                + [metric_name, column_data.max(), column_data.idxmax()]
            rows.append(row)

        df = pd.DataFrame(np.array(rows), columns=columns)

        return df

    def load_queries(self) -> Generator[Tuple[str, str, str], None, None]:
        with open('queries.toml', 'r') as f:
            whole_queries = toml.load(f)

        queries_by_product = whole_queries.values()
        for item in queries_by_product:
            product_name = item.pop('product_name')
            for query_data in item.values():
                metric_name = query_data['metric_name']
                query = query_data['query']
                yield (product_name, metric_name, query)

    def query_as_dataframe(self,
                           tz: datetime.timezone,
                           end_time: datetime.datetime, duration_minutes: int
                           ) -> pd.DataFrame:
        query_result_dataframes = []
        for product_name, metric_name, query in self.load_queries():
            query_result_df = self.query_mql(
                query=query, tz=tz, end_time=end_time,
                duration_minutes=duration_minutes)
            if query_result_df is None:
                continue
            query_result_df = self.find_peak(
                query_result_df, product_name=product_name,
                metric_name=metric_name)
            query_result_dataframes.append(query_result_df)

        final_df = pd.DataFrame()
        if len(query_result_dataframes) > 0:
            df = pd.concat(query_result_dataframes)
            column_order = self._sort_columns(df.columns.tolist())
            final_df = df[column_order]

        return final_df

    def query_mql(self, query: str, tz: datetime.timezone,
                  end_time: datetime.datetime, duration_minutes: int
                  ) -> pd.DataFrame:
        """Query metrics with given parameters and returns a dataframe.

        Aiming to produce the dataframe as shown below. Labels vary, depending
        on the query being given.

        | resource.region                  | global                        |
        | metric.client_country            | China | Japan | ... | Vietnam |
        | unit                             |   1/s |   1/s | ... |     1/s |
        | -------------------------------- | ----- | ----- | --- | ------- |
        | 2022-10-17 10:03:24.711898+09:00 |  11.1 | 123.5 | ... |    33.3 |
        | 2022-10-17 10:04:24.711898+09:00 |  11.1 | 123.5 | ... |    33.3 |
        | ...

        """

        name = f"projects/{self._project_id}"
        query = self._clean_query(query)
        query += self._build_within_filter(end_time, duration_minutes)
        request = monitoring_v3.QueryTimeSeriesRequest(
            name=name, query=self._clean_query(query))

        try:
            page_result = self._qsc.query_time_series(request=request)
        except (ValueError, TypeError) as e:
            raise MetricNotFoundError(e)
        except InvalidArgument:
            raise QueryParsingError("Failed to parsing the query.")
        except ServiceUnavailable:
            raise ServiceUnavailable(
                "Service unavailable error occured. Reauthentication may be \
                needed. Please run `gcloud auth application-default login` to \
                reauthenticate.")

        if len(page_result._response.time_series_data) > 0:
            df = self._build_dataframe(page_result, tz=tz)
        else:
            df = None

        return df


class MetricNotFoundError(ValueError):
    pass


class QueryParsingError(InvalidArgument):
    pass


@click.command()
@click.option(
    '--project_id', required=True, type=str,
    help='GCP project ID where the Cloud Monitoring API is called against.')
@click.option(
    '--end_time', required=False, type=click.DateTime(['%Y-%m-%dT%H:%M:%S%z']),
    help='The end time in ISO 8601 format of the time interval for which ' +
         'results should be returned. Default is now. ' +
         'e.g. 2022-10-03T05:23:02+09:00')
@click.option(
    '--duration_minutes', required=False, type=int, default=360,
    help='The number of minutes in the time interval ending at the time ' +
         'specified with --end_time. Default is 360 minutes (6 hours). ' +
         'Maximum depends on the period for aligned table specified by ' +
         '`every` in your queries, and duration_minutes / aligned_period ' +
         'in every query must be less than or equal to 100000.')
@click.option(
    '--output', required=False, type=click.Path(dir_okay=False, writable=True),
    default='logs/result.csv',
    help='The CSV file path for writing the results out. Default is ' +
         'logs/result.csv')
def main(project_id: str, end_time: datetime.datetime, duration_minutes: int,
         output: str):
    """Capacity Planner CLI.

    Capacity Planner CLI is a stand-alone tool to extract peak resource usage
    values and corresponding timestamps for a given GCP project, time range and
    timezone.
    """

    client = CapacityPlanner(project_id)

    # Set `end_time` as now() if not specified
    if end_time is None:
        end_time = datetime.datetime.now(datetime.timezone.utc)

    # Set the timezone for the results from `end_time`
    tz = end_time.tzinfo

    df = client.query_as_dataframe(
        tz=tz, end_time=end_time, duration_minutes=duration_minutes)

    logging.info("%s", df)

    df.to_csv(output, index=False)


if __name__ == '__main__':
    main()  # pragma: no cover
