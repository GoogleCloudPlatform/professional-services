# Copyright 2020 Google Inc.
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
import pprint
import sys
from gmon.utils import setup_logging, DotMap
from gmon.clients.monitoring import MetricsClient
from gmon.clients.account import AccountClient
from gmon.clients.service_monitoring import ServiceMonitoringClient

SAMPLE_METRIC_TYPE = "loadbalancing.googleapis.com/server/request_count"


def parse_args():
    args = sys.argv[1:]

    #-------------#
    # Main parser #
    #-------------#
    parser = argparse.ArgumentParser(prog='gmon', description='Stackdriver')
    subparsers = parser.add_subparsers(title='Endpoints', dest='parser')

    #-----------------#
    # Accounts parser #
    #-----------------#
    accounts = subparsers.add_parser('accounts',
                                     help='Stackdriver Account operations')
    accounts_sub = accounts.add_subparsers(dest='operation')
    accounts_get = accounts_sub.add_parser(
        'get', help='Get a Stackdriver Account details')
    accounts_create = accounts_sub.add_parser(
        'create', help='Create a Stackdriver Account')
    accounts_link = accounts_sub.add_parser(
        'link', help='Link a project to a Stackdriver Account')
    accounts_sub.add_parser('list', help='List Stackdriver Accounts')

    # TODO: Uncomment this when `delete` and `projects.delete`
    # operations are available.
    # accounts_delete = accounts_sub.add_parser(
    #     'delete', help='Delete a Stackdriver Account')
    # accounts_unlink = accounts_sub.add_parser(
    # 'unlink', help='Unlink a project from a SD Account')
    # accounts_unlink.add_argument('project', help='Project id to unlink')

    accounts_link.add_argument('project_id', help='Project id to link')
    for p in [accounts_get, accounts_create, accounts_link]:
        p.add_argument('--project',
                       '-p',
                       help='Stackdriver host project id.',
                       required=True)
        p.add_argument('--no-poll',
                       help='Do not poll operations to completion',
                       action='store_true',
                       required=False)

    #----------------#
    # Metrics parser #
    #----------------#
    metrics = subparsers.add_parser(
        'metrics', help='Cloud Monitoring Monitoring metrics operations')
    metrics_sub = metrics.add_subparsers(dest='operation')
    metrics_list = metrics_sub.add_parser(
        'list', help='List Cloud Monitoring Monitoring metrics')
    metrics_get = metrics_sub.add_parser(
        'get', help='Get Cloud Monitoring Monitoring metric descriptor')
    metrics_inspect = metrics_sub.add_parser(
        'inspect',
        help='Inspect Cloud Monitoring Monitoring metrics (last timeseries)')
    metrics_create = metrics_sub.add_parser(
        'create',
        help='Create a Cloud Monitoring Monitoring metric descriptor')
    metrics_delete = metrics_sub.add_parser(
        'delete',
        help='Delete a Cloud Monitoring Monitoring metric descriptor')
    metrics_delete_unused = metrics_sub.add_parser(
        'delete_unused',
        help='Delete unused Cloud Monitoring Monitoring metrics')

    metrics_create.add_argument('--description',
                                help='Metric description',
                                required=False)
    metrics_create.add_argument('--metric-kind',
                                help='Metric metric-kind',
                                default='GAUGE',
                                required=False)
    metrics_create.add_argument('--value-type',
                                help='Metric value-type',
                                default='DOUBLE',
                                required=False)
    metrics_inspect.add_argument('--window',
                                 '-w',
                                 type=int,
                                 help='Window to query (in seconds)',
                                 required=False,
                                 default=60)
    metrics_inspect.add_argument('--filters',
                                 nargs='+',
                                 help='Filter on nested fields.',
                                 required=False,
                                 default=[])
    metrics_inspect.add_argument('--fields',
                                 '-f',
                                 type=str,
                                 nargs='+',
                                 help='Fields to keep in response.',
                                 required=False,
                                 default=[])
    metrics_list.add_argument('--fields',
                              '-f',
                              type=str,
                              nargs='+',
                              help='Fields to keep in response.',
                              required=False,
                              default=['type'])
    metrics_list.add_argument('--limit',
                              '-n',
                              type=int,
                              help='Number of results to show.',
                              required=False,
                              default=None)
    metrics_list.add_argument('--filters',
                              nargs='+',
                              help='Filter on nested fields.',
                              required=False,
                              default=[])
    metrics_delete_unused.add_argument('--window',
                                       '-w',
                                       type=int,
                                       help='Window to query (in days)',
                                       required=False,
                                       default=1)

    for p in [metrics_list, metrics_delete_unused]:
        p.add_argument('regex',
                       nargs='?',
                       type=str,
                       help='Filter metric descriptors using a regex.',
                       default=None)
    for p in [
            metrics_list, metrics_get, metrics_create, metrics_inspect,
            metrics_delete, metrics_delete_unused
    ]:
        p.add_argument('--project',
                       '-p',
                       help='Cloud Monitoring host project id.',
                       required=True)
    for p in [metrics_get, metrics_create, metrics_inspect, metrics_delete]:
        p.add_argument(
            'metric-type',
            help='Metric descriptor type (e.g: "{SAMPLE_METRIC_TYPE}") or '
            'partial match')

    #--------------------#
    # Service Monitoring #
    #--------------------#
    # Services
    service_monitoring_service = subparsers.add_parser(
        'services', help='Cloud Monitoring Service Monitoring services')
    service_monitoring_service_sub = service_monitoring_service.add_subparsers(
        dest='operation')
    service_monitoring_service_get = service_monitoring_service_sub.add_parser(
        'get', help='Get a Cloud Monitoring Service Monitoring service')
    service_monitoring_service_create = service_monitoring_service_sub.add_parser(
        'create', help='Create a Cloud Monitoring Service Monitoring service')
    service_monitoring_service_update = service_monitoring_service_sub.add_parser(
        'update', help='Update a Cloud Monitoring Service Monitoring service')
    service_monitoring_service_delete = service_monitoring_service_sub.add_parser(
        'delete', help='Delete a Cloud Monitoring Service Monitoring service')
    service_monitoring_service_list = service_monitoring_service_sub.add_parser(
        'list', help='List a Cloud Monitoring Service Monitoring service')

    for p in [
            service_monitoring_service_list, service_monitoring_service_get,
            service_monitoring_service_create,
            service_monitoring_service_update,
            service_monitoring_service_delete
    ]:
        p.add_argument('--project',
                       '-p',
                       help='Cloud Monitoring host project id.',
                       required=True)
    for p in [
            service_monitoring_service_get, service_monitoring_service_create,
            service_monitoring_service_delete
    ]:
        p.add_argument('service_id', help='Cloud Monitoring service id')

    service_monitoring_service_create.add_argument(
        '--config', help='Path to service config.', required=True)

    # SLOs
    service_monitoring_slo = subparsers.add_parser(
        'slos', help='Cloud Monitoring Service Monitoring SLOs')
    service_monitoring_slo_sub = service_monitoring_slo.add_subparsers(
        dest='operation')
    service_monitoring_slo_get = service_monitoring_slo_sub.add_parser(
        'get', help='Get a Cloud Monitoring Service Monitoring SLO')
    service_monitoring_slo_create = service_monitoring_slo_sub.add_parser(
        'create', help='Create a Cloud Monitoring Service Monitoring SLO')
    service_monitoring_slo_update = service_monitoring_slo_sub.add_parser(
        'update', help='Update a Cloud Monitoring Service Monitoring SLO')
    service_monitoring_slo_delete = service_monitoring_slo_sub.add_parser(
        'delete', help='Delete a Cloud Monitoring Service Monitoring SLO')
    service_monitoring_slo_list = service_monitoring_slo_sub.add_parser(
        'list', help='List Cloud Monitoring Service Monitoring SLOs')

    for p in [
            service_monitoring_slo_list, service_monitoring_slo_get,
            service_monitoring_slo_update, service_monitoring_slo_create,
            service_monitoring_slo_delete
    ]:
        p.add_argument('--project',
                       '-p',
                       help='Cloud Monitoring host project id.',
                       required=True)
        p.add_argument('service_id', help='Cloud Monitoring service id')

    for p in [
            service_monitoring_slo_get, service_monitoring_slo_update,
            service_monitoring_slo_delete
    ]:
        p.add_argument('slo_id', help='SLO id.')

    service_monitoring_slo_create.add_argument('--config',
                                               help='Path to service config.',
                                               required=True)

    parsers = {
        'root': parser,
        'accounts': accounts,
        'metrics': metrics,
        'services': service_monitoring_service,
        'slos': service_monitoring_slo
    }
    return parsers, parser.parse_args(args)


def main():
    setup_logging()

    # Parse arguments
    parsers, args = parse_args()

    # Print help if no subparser is used
    parser = args.parser
    if not parser:
        parsers['root'].print_help()
        sys.exit(1)

    # Print help if no command is used
    command = getattr(args, 'operation', None)
    if not command:
        parsers[parser].print_help()
        sys.exit(1)

    # Parse optional args like limit, filters, fields...
    metric_type = getattr(args, 'metric-type', None)
    limit = getattr(args, 'limit', None)
    fields = getattr(args, 'fields', None)
    fields = parse_fields(fields)
    filters = getattr(args, 'filters', [])
    filters = parse_filters(filters)

    if parser == 'metrics':
        client = MetricsClient(args.project)
        method = getattr(client, command)

        if command in ['get', 'delete']:
            response = method(metric_type)

        elif command in ['create']:
            response = method(metric_type, args.metric_kind, args.value_type,
                              args.description)

        elif command in ['list']:
            response = method(pattern=args.regex, fields=fields)

        elif command in ['inspect']:
            response = method(metric_type, window=args.window)

        elif command in ['delete_unused']:
            response = method(pattern=args.regex, window=args.window)

        # Format, filter and print response
        print_response(response, limit, fields, filters)

    elif parser == 'accounts':
        if 'project' in args:
            client = AccountClient(project_id=args.project,
                                   no_poll=args.no_poll)
        else:
            client = AccountClient()
        method = getattr(client, command)
        if command in ['get', 'create', 'delete', 'list']:
            response = method()
        elif command in ['link', 'unlink']:
            response = method(project_id=args.project_id)

    elif parser == 'services':
        client = ServiceMonitoringClient(project_id=args.project)
        if command in ['get', 'create', 'delete']:
            method = getattr(client, command + '_service')
            response = method(args.service_id)
        else:
            method = getattr(client, command + '_services')
            response = method()
        print_response(response, limit, fields, filters)

    elif parser == 'slos':
        client = ServiceMonitoringClient(project_id=args.project)
        if command in ['get', 'create', 'delete']:
            method = getattr(client, command + '_slo')
            response = method(args.service_id, args.slo_id)
        else:
            method = getattr(client, command + '_slos')
            response = method(args.service_id)
        print_response(response, limit, fields, filters)


def parse_filters(filters=[]):
    """Function to parse `filters` CLI argument.

    Args:
        filters: A list of "key=value" strings.

    Returns:
        list: Parsed filters
    """
    ret = {}
    for f in filters:
        k, v = f.split("=")
        ret[k] = v
    return ret


def filter_response(response, filters={}):
    """Filter response from Stackdriver Monitoring APIs.

    Args:
        response (dict): JSON response.
        filters (dict): Filters as key-value dict.

    Returns:
        dict: Filtered response.
    """
    if not filters:
        return response
    dotted = DotMap(response)
    for k, v in filters.items():
        attr = dotted.lookup(k)
        # print(attr, '==', v, '?')
        if not attr == v:
            return None
    return response


def print_response(response, limit, fields, filters={}):
    """Print response from Stackdriver Monitoring APIs.

    Args:
        limit (int): Number of records to print.
        fields (list): List of fields to print. If only one field is selected,
            return 'flat' response.
    """
    # Iterate through response and send results to user
    if response is None:
        return None
    for idx, r in enumerate(response):
        if limit and idx >= limit:
            break
        if isinstance(r, dict) and filters:
            r = filter_response(r, filters)
        if not r:
            continue
        if fields:
            if len(fields) == 1:
                print(r[fields[0]])
                continue
            else:
                r = {k: v for k, v in r.items() if k in fields}
                pprint.pprint(r, indent=1, width=80)
        else:
            pprint.pprint(r, indent=1, width=80)


def parse_fields(fields):
    """Parse `fields` CLI argument.

    Args:
        fields (list): List of fields to display.

    Returns:
        list: Parsed fields.
    """
    # display all fields
    if fields == ['all']:
        return None

    # Remove unneeded fields
    to_remove = []
    if fields:
        # Go through fields and check for comma-delimited fields (user mistakes)
        for f in fields:
            if ',' in f:
                to_remove.append(f)
                more = f.split(",")
                fields.extend(more)
        for f in to_remove:
            fields.remove(f)
    return fields


if __name__ == '__main__':
    main()
