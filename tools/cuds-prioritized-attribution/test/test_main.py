# Copyright 2020 Google LLC
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

import argparse


def file_to_string(sql_path):
    """Converts a SQL file holding a SQL query to a string.
    Args:
        sql_path: String containing a file path
    Returns:
        String representation of a file's contents
    """
    with open(sql_path, 'r') as sql_file:
        return sql_file.read()


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('export-table')
    ap.add_argument('commitment-table')
    ap.add_argument('query')
    args = ap.parse_args()
    sql = file_to_string(args.query)
    fsql = sql.format(export_table=getattr(args, 'export-table'),
                      commitment_table=getattr(args, 'commitment-table'))
    print(fsql)


if __name__ == '__main__':
    main()
