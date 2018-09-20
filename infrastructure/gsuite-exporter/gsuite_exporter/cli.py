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
        file, name = tuple(exporter_class.split('.'))
        package = 'gsuite_exporter.exporters.%s' % file
        return getattr(importlib.import_module(package), name)
    except Exception as e:
        logger.exception(
            'Exporter "%s" not found. Verify the exporter class name is'
            'prefixed by the exporter file name.\n'
            'Example: `stackdriver_exporter.StackdriverExporter`',
            exporter_class)
        sys.exit()

def sync_all(
        admin_user,
        application,
        project_id,
        exporter,
        credentials_path=None):
    """Query last data from Admin SDK API and export them to the destination.

    Args:
        credentials_path (str): The GSuite Admin credentials file.
        token_path (str): The GSuite Admin Token file.
        application (str): The Gsuite Admin Application to query.
        project_id (str): The project id to export the data to.
        exporter (str): The exporter class to use.
    """
    fetcher = AdminReportsAPIFetcher(admin_user, credentials_path)
    exporter = get_exporter_cls(exporter)(project_id, application, credentials_path)

    # Fetch Admin SDK records
    records_stream = fetcher.fetch(
        application=application,
        start_time=exporter.last_timestamp)

    # Send logs to destination
    for records in records_stream:
        exporter.send(records, dry=False)
        logger.info("Last timestamp after export: {}".format(exporter.last_timestamp))


def main():
    parser = argparse.ArgumentParser(description='Add some integers.')
    parser.add_argument('--admin_user', type=str, help='GSuite Admin user.', required=True)
    parser.add_argument('--application', type=str, help='The GSuite Admin Application', required=True)
    parser.add_argument('--project_id', type=str, help='The project id to export GSuite data to.', required=True)
    parser.add_argument('--exporter', type=str, help='The exporter class to use.', default='stackdriver_exporter.StackdriverExporter', required=False)
    parser.add_argument('--credentials_path', type=str, help='GSuite Admin credentials file.', default=None, required=False)

    args = parser.parse_args()
    sync_all(
        args.admin_user,
        args.application,
        args.project_id,
        args.exporter,
        args.credentials_path
    )

if __name__ == '__main__':
    main()
