# Copyright 2019 Google LLC
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
import logging

from updater_tools import query_creator
from updater_tools import user_info_updater


def parse_args(argv):
    """Parses arguments from command line.

    Args:
        argv: list of arguments.

    Returns:
        parsed_args: parsed arguments.
    """
    parser = argparse.ArgumentParser()

    parser.add_argument('--schema_path',
                        help='Path to the user tables schema.',
                        default=True)
    parser.add_argument('--project_id',
                        help='Id of project holding BQ resources.',
                        required=True)
    parser.add_argument('--dataset_id',
                        help='Id of dataset holding Identity BQ tables.',
                        required=True)
    parser.add_argument(
        '--final_table_id',
        help='Id of final table holding golden record for each user.',
        required=True)
    parser.add_argument('--updates_table_id',
                        help='Id of table holding user updates.',
                        required=True)
    parser.add_argument(
        '--temp_updates_table_id',
        help='Id of table that deduped update rows will be written to.',
        required=True)
    parser.add_argument('--user_id_field_name',
                        help='Name of the field that identifies unique users.',
                        required=True)
    parser.add_argument(
        '--ingest_timestamp_field_name',
        help='Name of the timestamp field that marks the ingestion.'
        'of user rows.',
        required=True)

    args = parser.parse_args(args=argv)
    return args


def main(argv=None):
    """Main class for updating user info.

    args:
        argv: Args from command line.
    """
    args = parse_args(argv)
    schema_path = args.schema_path
    project_id = args.project_id
    dataset_id = args.dataset_id
    final_table_id = args.final_table_id
    updates_table_id = args.updates_table_id
    temp_updates_table_id = args.temp_updates_table_id
    user_id_field_name = args.user_id_field_name
    ingest_timestamp_field_name = args.ingest_timestamp_field_name

    # Create queries needed to run the updates
    update_query_creator = query_creator.QueryCreator(
        schema_path, user_id_field_name, ingest_timestamp_field_name,
        project_id, dataset_id, updates_table_id, temp_updates_table_id,
        final_table_id)
    gather_updates_query = update_query_creator.create_gather_updates_query()
    merge_updates_query = update_query_creator.create_merge_query()

    updater = user_info_updater.UserInfoUpdater(project_id, dataset_id,
                                                updates_table_id,
                                                temp_updates_table_id,
                                                final_table_id)

    # Gather new rows from the identity update table.
    new_updates = updater.gather_updates(gather_updates_query)
    # If there are new updates, merge them into the master table.
    if new_updates:
        updater.merge_updates(merge_updates_query)


if __name__ == '__main__':
    logging.getLogger().setLevel(logging.INFO)
    main()
