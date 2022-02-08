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
Entry point for the python module
"""
import argparse
import app


def main() -> None:
    parser = argparse.ArgumentParser(
        description='Cloud composer backup and restore utility')
    subparsers = parser.add_subparsers(dest='command')
    backup_sub = subparsers.add_parser('backup')
    restore_sub = subparsers.add_parser('restore')

    backup_sub.add_argument('--composer_env', required=True)
    backup_sub.add_argument('--project_id', required=True)
    backup_sub.add_argument('--composer_env_location', required=True)
    backup_sub.add_argument('--destination_bucket', required=True)

    restore_sub.add_argument('--composer_env', required=True)
    restore_sub.add_argument('--project_id', required=True)
    restore_sub.add_argument('--composer_env_location', required=True)
    restore_sub.add_argument('--source_bucket', required=True)
    restore_sub.add_argument('--source_folder', required=True)

    args = parser.parse_args()
    if args.command == 'backup':
        app.backup(args.composer_env, args.project_id,
                   args.composer_env_location, args.destination_bucket)
    elif args.command == 'restore':
        app.restore(args.composer_env, args.project_id,
                    args.composer_env_location, args.source_bucket,
                    args.source_folder)
    else:
        print(f'{args.command} unrecognized')


main()
