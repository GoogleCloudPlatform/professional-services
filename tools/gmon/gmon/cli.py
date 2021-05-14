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
"""
`cli.py`
Command-line interface for `gmon`.
"""
# pylint: disable=R0914,C0103,R0915,R0912,R1705,R1710
import argparse
import pprint
import sys
from gmon.utils import setup_logging, DotMap
from gmon.clients.monitoring import MetricsClient
from gmon.clients.account import AccountClient
from gmon.clients.service_monitoring import ServiceMonitoringClient

SAMPLE_METRIC_TYPE = "loadbalancing.googleapis.com/server/request_count"


def parse_args(args):
    """Parse CLI arguments.

    Args:
        args (list): List of args passed from CLI.

    Returns:
        tuple: A tuple (parser, args) after parsing with ArgumentParser.
    """
    # Main parser
    parser = argparse.ArgumentParser(prog='gmon',
                                     description='Cloud Operations CLI')
    subparsers = parser.add_subparsers(title='Endpoints', dest='parser')

    # Accounts parser
    accounts = subparsers.add_parser('accounts',
                                     help='Cloud Operations Account operations')
    accounts_sub = accounts.add_subparsers(dest='operation')
    accounts_get = accounts_sub.add_parser(
        'get', help='Get a Cloud Operations Account details')
    accounts_create = accounts_sub.add_parser(
        'create', help='Create a Cloud Operations Account')
    accounts_link = accounts_sub.add_parser(
        'link', help='Link a project to a Cloud Operations Account')
    # accounts_sub.add_parser('list', help='List Cloud Operations Accounts')

    # TODO: Uncomment this when `delete` and `projects.delete`
    # operations are available.
    # accounts_delete = accounts_sub.add_parser(
    #     'delete', help='Delete a Cloud Operations Account')
    # accounts_unlink = accounts_sub.add_parser(
    # 'unlink', help='Unlink a project from a SD Account')
    # accounts_unlink.add_argument('project', help='Project id to unlink')

    accounts_link.add_argument('project_id', help='Project id to link')
    for p in [accounts_get, accounts_create, accounts_link]:
        p.add_argument('--project',
                       '-p',
                       help='Cloud Monitoring host project id.',
                       required=True)
        p.add_argument('--no-poll',
                       help='Do not poll operations to completion',
                       action='store_true',
                       required=False)

    # Metrics parser
    metrics = subparsers.add_parser('metrics',
                                    help='Cloud Monitoring metrics operations')
    metrics_sub = metrics.add_subparsers(dest='operation')
    metrics_list = metrics_sub.add_parser('list',
                                          help='List Cloud Monitoring metrics')
    metrics_get = metrics_sub.add_parser(
        'get', help='Get Cloud Monitoring metric descriptor')
    metrics_inspect = metrics_sub.add_parser(
        'inspect', help='Inspect Cloud Monitoring metrics (last timeseries)')
    metrics_create = metrics_sub.add_parser(
        'create', help='Create a Cloud Monitoring metric descriptor')
    metrics_delete = metrics_sub.add_parser(
        'delete', help='Delete a Cloud Monitoring metric descriptor')
    metrics_delete_unused = metrics_sub.add_parser(
        'delete_unused', help='Delete unused Cloud Monitoring metrics')

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
                                 '-f',
                                 nargs='+',
                                 help='Filter on nested fields.',
                                 required=False,
                                 default=[])
    metrics_inspect.add_argument('--fields',
                                 type=str,
                                 nargs='+',
                                 help='Fields to keep in response.',
                                 required=False,
                                 default=[])
    metrics_list.add_argument('--fields',
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
                              '-f',
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

    # Service Monitoring
    # Services
    sm_service = subparsers.add_parser(
        'services', help='Cloud Monitoring Service Monitoring services')
    sm_service_sub = sm_service.add_subparsers(dest='operation')
    sm_service_get = sm_service_sub.add_parser(
        'get', help='Get a Cloud Monitoring Service Monitoring service')
    sm_service_create = sm_service_sub.add_parser(
        'create', help='Create a Cloud Monitoring Service Monitoring service')
    sm_service_update = sm_service_sub.add_parser(
        'update', help='Update a Cloud Monitoring Service Monitoring service')
    sm_service_delete = sm_service_sub.add_parser(
        'delete', help='Delete a Cloud Monitoring Service Monitoring service')
    sm_service_list = sm_service_sub.add_parser(
        'list', help='List a Cloud Monitoring Service Monitoring service')

    for p in [
            sm_service_list, sm_service_get, sm_service_create,
            sm_service_update, sm_service_delete
    ]:
        p.add_argument('--project',
                       '-p',
                       help='Cloud Monitoring host project id.',
                       required=True)
    for p in [sm_service_get, sm_service_create, sm_service_delete]:
        p.add_argument('service_id', help='Cloud Monitoring service id')

    sm_service_create.add_argument('--config',
                                   help='Path to service config.',
                                   required=True)

    # SLOs
    sm_slo = subparsers.add_parser(
        'slos', help='Cloud Monitoring Service Monitoring SLOs')
    sm_slo_sub = sm_slo.add_subparsers(dest='operation')
    sm_slo_get = sm_slo_sub.add_parser(
        'get', help='Get a Cloud Monitoring Service Monitoring SLO')
    sm_slo_create = sm_slo_sub.add_parser(
        'create', help='Create a Cloud Monitoring Service Monitoring SLO')
    sm_slo_update = sm_slo_sub.add_parser(
        'update', help='Update a Cloud Monitoring Service Monitoring SLO')
    sm_slo_delete = sm_slo_sub.add_parser(
        'delete', help='Delete a Cloud Monitoring Service Monitoring SLO')
    sm_slo_list = sm_slo_sub.add_parser(
        'list', help='List Cloud Monitoring Service Monitoring SLOs')

    for p in [
            sm_slo_list, sm_slo_get, sm_slo_update, sm_slo_create, sm_slo_delete
    ]:
        p.add_argument('--project',
                       '-p',
                       help='Cloud Monitoring host project id.',
                       required=True)
        p.add_argument('service_id', help='Cloud Monitoring service id')

    for p in [sm_slo_get, sm_slo_update, sm_slo_delete]:
        p.add_argument('slo_id', help='SLO id.')

    sm_slo_create.add_argument('--config',
                               help='Path to service config.',
                               required=True)

    parsers = {
        'root': parser,
        'accounts': accounts,
        'metrics': metrics,
        'services': sm_service,
        'slos': sm_slo
    }
    return parsers, parser.parse_args(args)


def main():
    """gmon CLI entrypoint."""
    parsers, args = parse_args(sys.argv[1:])
    cli(parsers, args)


def cli(parsers, args):
    """Main CLI function.

    Args:
        parsers (list): List of parsers.
        args (Namespace): Argparsed CLI parameters.
    """
    setup_logging()

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
    response = None

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
            response = method(metric_type, window=args.window, filters=filters)
            filters = {}  # already using API filters

        elif command in ['delete_unused']:
            response = method(pattern=args.regex, window=args.window)

        # Format, filter and print response
        return fmt_response(response, limit, fields, filters)

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
        return response

    elif parser == 'services':
        client = ServiceMonitoringClient(project_id=args.project)
        if command in ['get', 'create', 'delete']:
            method = getattr(client, command + '_service')
            response = method(args.service_id)
        else:
            method = getattr(client, command + '_services')
            response = method()
        return fmt_response(response, limit, fields, filters)

    elif parser == 'slos':
        client = ServiceMonitoringClient(project_id=args.project)
        if command in ['get', 'create', 'delete']:
            method = getattr(client, command + '_slo')
            response = method(args.service_id, args.slo_id)
        else:
            method = getattr(client, command + '_slos')
            response = method(args.service_id)
        return fmt_response(response, limit, fields, filters)


def parse_filters(filters=[]):
    """Function to parse `filters` CLI argument.

    Args:
        filters: A list of "key=value" strings.

    Returns:
        dict: A dict of parsed filters.
    """
    ret = {}
    for f in filters:
        k, v = f.split("=")
        ret[k] = v
    return ret


def filter_response(response, filters={}):
    """Filter response from Cloud Monitoring APIs.

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


def fmt_response(response, limit, fields, filters={}):
    """Format response from Cloud Monitoring APIs.

    Args:
        limit (int): Number of records to print.
        fields (list): List of fields to print. If only one field is selected,
            return 'flat' response.
        filters (dict): Filters to filter the response on.

    Returns:
        list: List of JSON responses with filtering and fields selection to
            print.
    """
    responses = []
    if response is None:
        return
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
            r = {k: v for k, v in r.items() if k in fields}
            pprint.pprint(r, indent=1, width=80)
            responses.append(r)
        else:
            pprint.pprint(r, indent=1, width=80)
            responses.append(r)
    return responses


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
