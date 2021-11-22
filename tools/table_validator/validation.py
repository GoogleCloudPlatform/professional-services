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

from datetime import datetime
import argparse
import json
import sys
import concurrent.futures
import itertools
import copy
import csv

from google.api_core.exceptions import NotFound
from google.cloud import bigquery
from utils import bigquery_utils


def main():
    parser = argparse.ArgumentParser(description='Process some configurations')
    parser.add_argument('-c',
                        '--configuration',
                        help='configuration of '
                        'tables and primary '
                        'keys',
                        required=True)
    parser.add_argument('-p',
                        '--project_id',
                        help='project_id of GCP project '
                        'you would like to run '
                        'queries on')
    parser.add_argument('-s',
                        '--schema',
                        help='schema file path to get '
                        'primary keys of datasets '
                        'easily')
    args = parser.parse_args()

    if not args.configuration:
        sys.exit()
    with open(args.configuration) as json_file:
        config_data = json.load(json_file)

    if args.project_id:
        project_id = args.project_id
    else:
        project_id = config_data['project_id']

    query_runner = bigquery.Client(project=project_id)

    client = bigquery.Client(project=config_data['project_id'])

    matching_table_names_left = []
    matching_table_names_right = []
    count_same = 0.0
    count_total = 0.0

    if 'leftDatasetname' and 'rightDatasetname' in config_data.keys():
        left = client.list_tables(config_data['leftDatasetname'])
        right = client.list_tables(config_data['rightDatasetname'])
        config_datas = []
        table_names = {}
        if args.schema:
            with open(args.schema) as csv_file:
                schema_file = csv.reader(csv_file)
                for row in schema_file:
                    if row[1] not in table_names:
                        table_names[row[1]] = []
                    table_names[row[1]].append(row[2])
        try:
            table_names = config_data['primaryKeys']
        except KeyError:
            ValueError('Missing schema file. If you would like to validate '
                       'one table please do not include the dataset names and '
                       'pass in the columns to exclude as well as the primary '
                       'keys.')
        for l, r in zip(left, right):
            if l.table_id == r.table_id:
                matching_table_names_left.append(
                    l.full_table_id.replace(':', '.'))
                matching_table_names_right.append(
                    r.full_table_id.replace(':', '.'))
                count_same += 1
                # config_data.get['primaryKeys'] = table_names[l.table_id]
                config_datas.append(copy.deepcopy(config_data))
            count_total += 1
        percent_same = count_same / count_total * 100
        print(f'{percent_same}% of tables exist in both datasets')
        query_runners = list(
            itertools.repeat(query_runner, len(matching_table_names_left)))
        clients = list(itertools.repeat(client, len(matching_table_names_left)))
        if percent_same > 90:
            with concurrent.futures.ThreadPoolExecutor(max_workers=5) as \
                    executor:
                results = executor.map(create_diff_tables, query_runners,
                                       clients, config_datas,
                                       matching_table_names_left,
                                       matching_table_names_right)
                for _ in results:
                    continue

    else:
        # set up client
        try:
            l_table = config_data['leftTablename']
            r_table = config_data['rightTablename']
            # only when tables are given take in columns primarykeys
            create_diff_tables(query_runner, client, config_data, l_table,
                               r_table)
        except NotFound:
            ValueError(
                f'There is something wrong with a project name either '
                f'in your config, `{config_data["project_id"]}`, or argument, `{args.project_id}`!'
            )


def get_results_table_schema():
    return [
        bigquery.schema.SchemaField(name="table_name", field_type="STRING"),
        bigquery.schema.SchemaField(name="column_name", field_type="STRING"),
        bigquery.schema.SchemaField(name="pct_diff", field_type="FLOAT"),
        bigquery.schema.SchemaField(name="cnt_diff", field_type="INTEGER"),
        bigquery.schema.SchemaField(name="missing_rows_count",
                                    field_type="INTEGER"),
        bigquery.schema.SchemaField(name="mismatch_rows_count",
                                    field_type="INTEGER"),
        bigquery.schema.SchemaField(name="test_time", field_type="TIMESTAMP"),
    ]


def materialize_detailed_diff_stats(client, destination_dataset, l_column_name,
                                    r_column_name, l_table_name, r_table_name,
                                    columns_list, mismatch_total_rows,
                                    mismatch_table_name,
                                    left_missing_rows_table_name,
                                    right_missing_rows_table_name):
    """
    This method gathers the statistics related to the differences between the
    left and right tables and inserts them into a table named
    "validation_results". If the table doesn't exist, it will create one.
    """
    mismatch_rows_count, missing_rows_count = calculate_diff_stats(
        client, l_table_name, r_table_name, mismatch_table_name,
        left_missing_rows_table_name, right_missing_rows_table_name)
    total_rows = mismatch_total_rows
    select_statement = []
    for column in columns_list:
        table_pct_mismatch = (
            f'SAFE_DIVIDE( '
            f'SUM( IF({column}.{l_column_name} IS NULL AND {column}.{r_column_name} IS NULL, 0, 1) ) , '
            f'{total_rows} ) ')

        table_cnt_diff = (
            f'SUM( IF({column}.{l_column_name} IS NULL AND {column}.{r_column_name} IS NULL, 0, 1) )'
        )
        select_statement.append((f'STRUCT( '
                                 f'{table_pct_mismatch} AS pct_diff, '
                                 f'{table_cnt_diff} AS cnt_diff '
                                 f') AS {column}'))

    validation_results = []
    validation_results_table_name = f'{destination_dataset}.validation_results_{mismatch_table_name.replace(".", "_")}'
    try:
        validation_results_table_ref = client.get_table(
            bigquery_utils.get_table_ref(client, validation_results_table_name))
    except NotFound:
        # Create the results table if it doesn't exist
        table_name = f'{client.project}.{validation_results_table_name}'
        new_table = bigquery.table.Table(table_name, get_results_table_schema())
        validation_results_table_ref = client.create_table(new_table)

    select_columns = ',\n'.join(select_statement)
    query_string = f'SELECT {select_columns} FROM {mismatch_table_name}'
    rows = client.query(query_string)
    time_of_run = datetime.utcnow()
    for row in rows:
        for column in columns_list:
            columns_pivot_to_rows = {
                'table_name': l_table_name.split('.')[1],
                'column_name': column,
                'missing_rows_count': int(missing_rows_count),
                'mismatch_rows_count': int(mismatch_rows_count)
            }

            pct_diff = row.get(column).get('pct_diff')
            columns_pivot_to_rows['pct_diff'] = float(pct_diff or 0.0)

            cnt_diff = row.get(column).get('cnt_diff')
            columns_pivot_to_rows['cnt_diff'] = int(cnt_diff or 0)

            columns_pivot_to_rows['test_time'] = time_of_run
            validation_results.append(columns_pivot_to_rows)
    client.insert_rows(validation_results_table_ref, validation_results)
    console_link = bigquery_utils.get_console_link_for_table_ref(
        validation_results_table_ref)
    print(f'View Results Table in Console:\n{console_link}')


def create_diff_tables(query_runner, client, config_data, l_table, r_table):
    l_dataset_name = l_table.split('.')[1]
    l_table_name = l_table.split('.')[1] + '.' + l_table.split('.')[2]

    r_dataset_name = r_table.split('.')[1]
    r_table_name = r_table.split('.')[1] + '.' + r_table.split('.')[2]

    destination_dataset = config_data['destinationDataset']
    l_destination_table = f"{destination_dataset}.{l_table_name.split('.')[1]}"
    r_destination_table = f"{destination_dataset}.{r_table_name.split('.')[1]}"
    primary_keys = config_data.get('primaryKeys')

    columns_list = bigquery_utils.get_full_columns_list(
        client, config_data.get('excludeColumnMapping'),
        l_table_name, r_table_name)
    if columns_list is None:
        return None
    l_column_name = l_table_name.replace('.', '_')
    r_column_name = r_table_name.replace('.', '_')
    type_cast_dict = get_type_cast_dict(client, l_table_name, columns_list)

    # Create table containing all mismatches between the columns of the left
    # and right tables after joining on the primary keys specified in config
    # file

    mismatch_query = generate_query_string_mismatch_row(
        l_table, r_table, l_column_name, r_column_name, primary_keys,
        columns_list, type_cast_dict)
    mismatch_table_name = f'{l_destination_table}_mismatches'

    # Create table containing the all the missing rows which were present in
    # the left table but not present in the right table
    right_table_missing_rows_query = generate_query_string_missing_row(
        l_table, r_table, l_column_name, r_column_name, primary_keys,
        columns_list, type_cast_dict)
    right_missing_rows_table_name = f'{r_destination_table}_{r_dataset_name}_missing_rows'

    # Create table containing the all the missing rows which were present in
    # the right table but not present in the left table
    left_table_missing_rows_query = generate_query_string_missing_row(
        r_table, l_table, r_column_name, l_column_name, primary_keys,
        columns_list, type_cast_dict)
    left_missing_rows_table_name = f'{l_destination_table}_{l_dataset_name}_missing_rows'

    with concurrent.futures.ThreadPoolExecutor(max_workers=5) as executor:
        mismatch_rows = executor.map(
            start_diff_query_job, [client, client, client],
            [query_runner, query_runner, query_runner], [
                mismatch_query, right_table_missing_rows_query,
                left_table_missing_rows_query
            ], [
                mismatch_table_name, right_missing_rows_table_name,
                left_missing_rows_table_name
            ], [
                'mismatches', 'right_missing', 'left_missing'
            ])

        # Create or Append to results table which keeps track of all tables
        # and their stats
        for result in mismatch_rows:
            if result.get('label') == 'mismatches':
                mismatch_total_rows = result.get('rows').total_rows
                materialize_detailed_diff_stats(
                    client, destination_dataset, l_column_name, r_column_name,
                    l_table_name, r_table_name, columns_list, mismatch_total_rows,
                    mismatch_table_name, left_missing_rows_table_name,
                    right_missing_rows_table_name)
                print('##############################################################')
                print('##############################################################')
                print('')


def calculate_diff_stats(client, l_table_name, r_table_name,
                         mismatch_table_name, left_missing_rows_table_name,
                         right_missing_rows_table_name):
    left_missing_row_count = client.get_table(
        bigquery_utils.get_table_ref(client,
                                     left_missing_rows_table_name)).num_rows
    right_missing_row_count = client.get_table(
        bigquery_utils.get_table_ref(client,
                                     right_missing_rows_table_name)).num_rows
    mismatch_row_count = client.get_table(
        bigquery_utils.get_table_ref(client, mismatch_table_name)).num_rows
    total_differences = left_missing_row_count + \
                        right_missing_row_count + mismatch_row_count
    total_missing_rows = left_missing_row_count + right_missing_row_count

    print('##############################################################')
    if total_differences == 0:
        print(f'Tables {l_table_name} and {r_table_name} are a match')
    else:
        print(f'Tables {l_table_name} and {r_table_name} are not a match')
        print(f'missing rows count: {total_missing_rows}')
        print(f'mismatching rows count: {mismatch_row_count}')
    print('##############################################################')
    return mismatch_row_count, total_missing_rows


def start_diff_query_job(client, query_runner, query, destination_table, label):
    job_config = bigquery.QueryJobConfig()
    table_ref = bigquery_utils.get_table_ref(client, destination_table)
    print(f"Creating ( {destination_table.split('.')[1]} )")
    if table_ref:
        job_config.destination = table_ref
        job_config.write_disposition = 'WRITE_TRUNCATE'

    # Start the query, passing in the extra configuration.
    query_job = query_runner.query(query, job_config=job_config)
    print(
        f'View Query\n{bigquery_utils.get_console_link_for_query_job(query_job)}'
    )

    rows = query_job.result()  # Waits for the query to finish
    if destination_table:
        print(
            f'View Table {destination_table}\n{bigquery_utils.get_console_link_for_table_ref(table_ref)}'
        )
    print('\n')
    return {'label': label, 'rows': rows}


def get_type_cast_dict(client, tablename, columns_list):
    # We need to cast nulls to correct types for a union all query
    # Since BQ is inconsistent in type names we need to create a map
    # of column name to a type it should be cast to if the column
    # value is selected as null.
    bq_type_alias_dict = {
        'INTEGER': 'INT64',
        'FLOAT': 'FLOAT64',
        'BOOLEAN': 'BOOL',
        'STRING': 'STRING',
        'BYTES': 'BYTES',
        'TIMESTAMP': 'TIMESTAMP',
        'TIME': 'TIME',
        'DATE': 'DATE',
        'DATETIME': 'DATETIME'
    }

    columns_dict = {}
    for column in columns_list:
        columns_dict[column.upper()] = column

    type_cast_dict = {}

    table = client.get_table(tablename)
    schema = table.schema
    for schema_field in schema:
        if schema_field.name.upper() in columns_dict:
            field_type = schema_field.field_type
            if field_type in bq_type_alias_dict:
                field_type = bq_type_alias_dict[field_type]
            type_cast_dict[columns_dict[schema_field.name.upper()]] = field_type
    return type_cast_dict


def get_join_condition(primary_keys):
    # We always join on primary keys
    join_conditions = []
    for primary_key in primary_keys:
        l_table_column = f'l.{primary_key}'
        r_table_column = f'r.{primary_key}'
        join_conditions.append(f'{l_table_column} = {r_table_column}')
    return ' \nAND '.join(join_conditions)


def generate_query_string_mismatch_row(tablename_left, tablename_right,
                                       l_column_name, r_column_name,
                                       primary_keys, columns_list,
                                       type_cast_dict):
    """
      This method will produce a query to detect rows with matching
      primary key but mismatching values in some columns. The output of
      the query is a set of rows where each column is populated with
      corresponding value.
    """
    fields = []
    where_conditions = []

    for column_name in columns_list:
        l_table_column = f'l.{column_name}'
        r_table_column = f'r.{column_name}'
        if column_name in primary_keys and column_name not in columns_list:
            left_column = l_table_column
            right_column = r_table_column
        else:
            left_column = (
                f'CASE WHEN {l_table_column} = {r_table_column} THEN CAST(NULL AS {type_cast_dict[column_name]}) '
                f'ELSE {l_table_column} END')
            right_column = (
                f'CASE WHEN {r_table_column} = {l_table_column} THEN CAST(NULL AS {type_cast_dict[column_name]}) '
                f'ELSE {r_table_column} END')
            where_conditions.append((
                f'( {l_table_column} IS NULL AND {r_table_column} IS NOT NULL ) '
                f'OR ( {r_table_column} IS NULL AND {l_table_column} IS NOT NULL ) '
                f'OR {l_table_column} != {r_table_column}'))

        fields.append(
            (f'STRUCT( {left_column} AS {l_column_name},\n'
             f'\t\t{right_column} AS {r_column_name} ) AS {column_name}'))

    field_list = ',\n\t'.join(fields)
    join_condition_string = get_join_condition(primary_keys)
    where_condition = ' OR\n\t'.join(where_conditions)

    return get_select_query_string('INNER JOIN', join_condition_string,
                                   where_condition, field_list, tablename_left,
                                   tablename_right)


def generate_query_string_missing_row(tablename_left, tablename_right,
                                      l_column_name, r_column_name,
                                      primary_keys, columns_list,
                                      type_cast_dict):
    """
      This method will produce a query to detect rows present in a left table
      but not in the right table. The output of the query are a set of rows
      where only primary keys from a left table are present. Every other column
      is set to null.
    """
    fields = []
    where_conditions = []

    for column_name in columns_list:
        r_table_column = f'r.{column_name}'

        left_column = f'CAST(null AS {type_cast_dict[column_name]})'
        right_column = f'CAST(null AS {type_cast_dict[column_name]})'

        if column_name in primary_keys:
            left_column = f'{column_name}'
            where_conditions.append(f'{r_table_column} is null')

        fields.append(
            f'STRUCT({left_column} as {l_column_name}, {right_column} as {r_column_name}) as {column_name}'
        )

    select_columns = ',\n\t'.join(fields)
    return (
        f'SELECT \n'
        f'\t{select_columns}\n'
        f'FROM\n'
        f'({generate_query_string_missing_row_keys(tablename_left, tablename_right, primary_keys)})'
    )


def generate_query_string_missing_row_keys(tablename_left, tablename_right,
                                           primary_keys):
    """
      This method will produce a query to detect rows present in a left table
      but not in the right table. The output of the query are a set of rows
      where only primary keys from a left table are present. Every other column
      is set to null.
    """
    fields = []
    where_conditions = []

    for column_name in primary_keys:
        l_table_column = f"l.{column_name}"
        r_table_column = f"r.{column_name}"
        fields.append(f'{l_table_column} as {column_name}')
        where_conditions.append(f'{r_table_column} is null')

    join_type_string = 'LEFT OUTER JOIN\t'
    join_condition_string = get_join_condition(primary_keys)
    field_list = ',\n\t'.join(fields)
    if where_conditions:
        where_condition = ' OR\n\t'.join(where_conditions)
    else:
        where_condition = None
    select_modifier = 'DISTINCT'

    return get_select_query_string(join_type_string, join_condition_string,
                                   where_condition, field_list, tablename_left,
                                   tablename_right, select_modifier)


def get_select_query_string(join_type_string,
                            join_condition_string,
                            where_condition,
                            field_list,
                            tablename_left,
                            tablename_right,
                            select_modifier=''):
    select_query_string = (f'SELECT {select_modifier} \n'
                           f'\t{field_list}\n'
                           f'FROM\n\t`{tablename_left}` AS l\n'
                           f'{join_type_string}\n'
                           f'\t`{tablename_right}` AS r\n'
                           f'ON\n'
                           f'\t{join_condition_string}\n')
    if where_condition:
        return f'{select_query_string}WHERE\n\t{where_condition}'
    print(select_query_string)
    return select_query_string


if __name__ == '__main__':
    main()
