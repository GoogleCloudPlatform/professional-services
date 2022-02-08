# Copyright 2022 Google LLC
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
"""
Module implements a set of utility functions for interacting with the
airflow postgres database mainly for dump and import operations.
"""
from postgres import Database
import command_utils


def extract_db_dump(username: str, password: str, host: str, port: str,
                    database: str, dump_file_name: str) -> str:
    """
    Applies a pg_dump command and saves it to /tmp, returns back a string
    with the full path e.g. /tmp/composer-db-dump-10-10-2020:10:30:00.sql
    """
    connection = f'postgresql://{username}:{password}@{host}:{port}/{database}'
    command = [
        'pg_dump', '--clean', f'{connection}', '-f', f'/tmp/{dump_file_name}'
    ]
    command_utils.sh(command)
    return f'/tmp/{dump_file_name}'


def build_sequence_file(username: str, password: str, host: str, port: str,
                        database: str, sequence_file_name: str):
    """
    Queries the Airflow postgres DB information_schema to extract serial
    sequences. Generates setval statements to update all serial sequences
    based on the max value of the associated field. Writes statements to
    a sql file in /tmp and return the path.
    """
    db = Database(host, database, username, password, port)

    table_sequences = db.execute_query("""
      SELECT
          tbls.table_name as tbl,
          cols.column_name as col,
          PG_GET_SERIAL_SEQUENCE(tbls.table_name, cols.column_name) as serial_seq
      FROM information_schema.tables tbls
      JOIN information_schema.columns as cols
      ON cols.table_name = tbls.table_name
      WHERE
      tbls.table_schema NOT IN ('information_schema', 'pg_datalog') AND
      tbls.table_type = 'BASE TABLE' AND
      PG_GET_SERIAL_SEQUENCE(tbls.table_name, cols.column_name) IS NOT NULL;
      """)

    sequence_sql = ''
    for seq in table_sequences:
        table_name, column_name, seq_name = seq
        max_val_query = f"""SELECT MAX({column_name}) FROM {table_name}"""
        max_val_result = db.execute_query(max_val_query)
        max_val = max_val_result[0][0]
        if max_val is not None:
            sequence_sql += f"SELECT setval('{seq_name}', {(max_val + 1)});\n"

    output_write_path = f'/tmp/{sequence_file_name}'
    with open(output_write_path, 'w', encoding='utf-8') as sequence_output:
        sequence_output.write(sequence_sql)

    return output_write_path


def import_db(username: str, password: str, host: str, port: str, database: str,
              gcs_sql_file_path: str) -> None:
    """
    Extract a SQL filefrom a GCS path and imports it into postgres
    """
    command_utils.sh(['gsutil', 'cp', gcs_sql_file_path, '/tmp/'])

    split_path = gcs_sql_file_path.split('/')

    return command_utils.sh([
        'psql', '-d',
        f'postgresql://{username}:{password}@{host}:{port}/{database}', '-f',
        f'/tmp/{split_path[-1]}'
    ])
