# Copyright 2018 Google Inc.
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

import argparse
import importlib
import re
import sys
import logging
from gsuite_exporter import exporters
from gsuite_exporter.collectors.reports import AdminReportsAPIFetcher

logging.basicConfig(stream=sys.stdout, level=logging.INFO)
logging.getLogger('googleapiclient').setLevel(logging.ERROR)

logger = logging.getLogger(__name__)

def get_exporter_cls(exporter_class):
    try:
        filename, name = exporter_class.split('.')
        package = 'gsuite_exporter.exporters.%s' % filename
        return getattr(importlib.import_module(package), name)
    except Exception as e:
        logger.exception(
            'Exporter "%s" not found. Verify the exporter class name is'
            'prefixed by the exporter file name.\n'
            'Example: `stackdriver_exporter.StackdriverExporter`',
            exporter_class)
        sys.exit(1)

def sync_all(
        admin_user,
        api,
        applications,
        project_id,
        exporter_cls,
        credentials_path=None):
    """Query last data from Admin SDK API and export them to the destination.

    Args:
        credentials_path (str): The GSuite Admin credentials file.
        api (str): The GSuite Admin API to get data from.
        token_path (str): The GSuite Admin Token file.
        applications (list): The Gsuite Admin Applications to query.
        project_id (str): The project id to export the data to.
        exporter_cls (str): The exporter class to use.
    """
    fetcher = AdminReportsAPIFetcher(admin_user, credentials_path)
    exporter = get_exporter_cls(exporter_cls)(
        project_id=project_id,
        credentials_path=credentials_path)

    for app in applications:
        last_timestamp = exporter.get_last_timestamp(app)
        exporter_dest = exporter.get_destination(app)
        logger.info(
            "%s.%s --> %s (%s) [starting new sync]. Last sync: %s",
            api,
            app,
            exporter_cls,
            exporter_dest,
            last_timestamp)

        records_stream = fetcher.fetch(
            application=app,
            start_time=last_timestamp)

        for records in records_stream:
            response = exporter.send(records, app, dry=False)
            logger.info(
                "%s.%s --> %s (%s) [%s new records synced]",
                api,
                app,
                exporter_cls,
                exporter_dest,
                len(records))

def main():
    parser = argparse.ArgumentParser(description='Add some integers.')
    parser.add_argument(
        '--admin-user',
        type=str,
        required=True,
        help='The GSuite Admin user email.')
    parser.add_argument(
        '--api',
        type=str,
        default='reports_v1',
        required=False,
        help='The GSuite Admin API.')
    parser.add_argument(
        '--applications',
        type=str,
        nargs='+',
        required=True,
        help='The GSuite Admin Applications.')
    parser.add_argument(
        '--project-id',
        type=str,
        required=True,
        help='The project id to export GSuite data to.')
    parser.add_argument(
        '--exporter',
        type=str,
        default='stackdriver_exporter.StackdriverExporter',
        required=False,
        help='The exporter class to use.')
    parser.add_argument(
        '--credentials-path',
        type=str,
        default=None,
        required=False,
        help='The service account credentials file.')
    args = parser.parse_args()
    sync_all(
        args.admin_user,
        args.api,
        args.applications,
        args.project_id,
        args.exporter,
        args.credentials_path)

if __name__ == '__main__':
    main()
