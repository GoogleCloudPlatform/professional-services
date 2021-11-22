# Copyright 2019 Google Inc.
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

import collections


class OrderedSet(collections.Set):
    """
    a set that maintains the order of a list and allows for a simple comparison of two lists.
    """
    def __init__(self, iterable=()):
        self.d = collections.OrderedDict.fromkeys(iterable)

    def __len__(self):
        return len(self.d)

    def __contains__(self, element):
        return element in self.d

    def __iter__(self):
        return iter(self.d)


def compare_columns(left_col_list, right_col_list):
    """
    compares the left and right column schema to see if their ordering and column names match.
    :param left_col_list:
    :param right_col_list:
    :return:
    """
    return OrderedSet(left_col_list) == OrderedSet(right_col_list)


def get_table_ref(client, table_id_str):
    """
    Creates a TableReference.
    :param client: BigQuery Client
    :param table_id_str:
    :return: google.cloud.bigquery.table.TableReference
    """
    if table_id_str:
        dataset_name = table_id_str.split('.')[0]
        table_name = table_id_str.split('.')[1]
        return client.dataset(dataset_name).table(table_name)
    raise ValueError('Table name not found')


def get_console_link_for_table_ref(table_ref):
    """
    Returns the string URL for a given TableReference. The URL navigates to
    the BigQuery table in the GCP console.
    :param table_ref: google.cloud.bigquery.table.TableReference
    :return: string Link to BigQuery Table in GCP Console
    """
    return (
        f'https://console.cloud.google.com/bigquery?'
        f'project={table_ref.project}'
        f'&p={table_ref.project}'
        f'&t={table_ref.table_id}'
        f'&d=validation&orgonly=true'
        f'&supportedpurview=organizationId&page=table'
    )


def get_console_link_for_query_job(query_job):
    return (
        f'https://console.cloud.google.com/bigquery?'
        f'project={query_job.project}'
        f'&j=bq:{query_job.location}:{query_job.job_id}'
        f'&page=queryresults&orgonly=true&supportedpurview=organizationId'
    )


def get_full_columns_list(client, exclude_columns_list, l_table_name, r_table_name):
    """
    This method will first retrieve the source table columns to preserve the same column order in this method's output
    :param client: BigQuery client
    :param exclude_columns_list: list of columns to exclude
    :param primary_keys: list of primary keys
    :param l_table_name: left table name
    :param r_table_name: right table name
    :return:
    """
    #
    l_table = client.get_table(get_table_ref(client, l_table_name))
    r_table = client.get_table(get_table_ref(client, r_table_name))
    l_columns_all = [f'{schema.name}' for schema in l_table.schema]
    r_columns_all = [f'{schema.name}' for schema in r_table.schema]
    if exclude_columns_list is None:
        exclude_columns_list=[]
    l_columns = list(OrderedSet(l_columns_all) - exclude_columns_list)
    r_columns = list(OrderedSet(r_columns_all) - exclude_columns_list)

    if l_columns == r_columns:
        return l_columns
    else:
        print(f'Table Schemas for table `{l_table_name}` and `{r_table_name}` are not equal!')
        return None
