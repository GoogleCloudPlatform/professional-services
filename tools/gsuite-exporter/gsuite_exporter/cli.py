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
from datetime import timedelta
from dateutil import parser
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
        credentials_path=None,
        offset=None):
    """Query last data from Admin SDK API and export them to the destination.

    Args:
        credentials_path (str): Service account credentials file.
        api (str): GSuite Admin API name to get data from.
        token_path (str): GSuite Admin Token file.
        applications (list): Gsuite Admin Applications to query.
        project_id (str): Project id to export the data to.
        exporter_cls (str): Exporter class to use.
        offset (str): Minutes to look back before the last timestamp
    """
    fetcher = AdminReportsAPIFetcher(admin_user, credentials_path)
    exporter = get_exporter_cls(exporter_cls)(
        project_id=project_id,
        credentials_path=credentials_path)

    for app in applications:
        last_ts = exporter.get_last_timestamp(app)
        if last_ts is None:
            start_time = None
        else:
            start_time = (parser.parse(last_ts) - timedelta(minutes=offset)).isoformat()
        exporter_dest = exporter.get_destination(app)
        logger.info(
            "%s.%s --> %s (%s) [starting new sync] from %s (offset => %s mn)",
            api,
            app,
            exporter_cls,
            exporter_dest,
            start_time,
            offset)
        records_stream = fetcher.fetch(application=app, start_time=start_time)
        for records in records_stream:
            response = exporter.send(records, app, dry=False)
            logger.debug(response)
            logger.info(
                "%s.%s --> %s (%s) [%s new records synced]",
                api,
                app,
                exporter_cls,
                exporter_dest,
                len(records))

def main():
    parser = argparse.ArgumentParser()
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
    parser.add_argument(
        '--offset',
        type=int,
        default=0,
        required=False,
        help='The offset to fetch logs from before the last sync (in minutes).')
    args = parser.parse_args()
    sync_all(
        args.admin_user,
        args.api,
        args.applications,
        args.project_id,
        args.exporter,
        args.credentials_path,
        args.offset)


if __name__ == '__main__':
    main()
