# Copyright 2019 Google Inc.
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
Command-Line interface of `slo-generator`.
"""

import argparse
import logging
import sys

from slo_generator.compute import compute
import slo_generator.utils as utils

LOGGER = logging.getLogger(__name__)


def main():
    """slo-generator CLI entrypoint."""
    args = parse_args(sys.argv[1:])
    cli(args)


def cli(args):
    """Main CLI function.

    Args:
        args (Namespace): Argparsed CLI parameters.

    Returns:
        dict: Dict of all reports indexed by config file path.
    """
    utils.setup_logging()
    export = args.export
    delete = args.delete
    timestamp = args.timestamp

    # Load error budget policy
    LOGGER.debug(f"Loading Error Budget config from {args.error_budget_policy}")
    eb_path = utils.normalize(args.error_budget_policy)
    eb_policy = utils.parse_config(eb_path)

    # Parse SLO folder for configs
    slo_configs = utils.list_slo_configs(args.slo_config)
    if not slo_configs:
        LOGGER.error(f'No SLO configs found in SLO folder {args.slo_config}.')

    # Load SLO configs and compute SLO reports
    all_reports = {}
    for path in slo_configs:
        slo_config_name = path.split("/")[-1]
        LOGGER.debug(f'Loading SLO config "{slo_config_name}"')
        slo_config = utils.parse_config(path)
        reports = compute(slo_config,
                          eb_policy,
                          timestamp=timestamp,
                          do_export=export,
                          delete=delete)
        all_reports[path] = reports
    LOGGER.debug(all_reports)
    return all_reports


def parse_args(args):
    """Parse CLI arguments.

    Args:
        args (list): List of args passed from CLI.

    Returns:
        obj: Args parsed by ArgumentParser.
    """
    parser = argparse.ArgumentParser()
    parser.add_argument('--slo-config',
                        '-f',
                        type=str,
                        required=False,
                        help='SLO configuration file (JSON / YAML)')
    parser.add_argument('--error-budget-policy',
                        '-b',
                        type=str,
                        required=False,
                        default='error_budget_policy.yaml',
                        help='Error budget policy file (JSON / YAML)')
    parser.add_argument('--export',
                        '-e',
                        type=utils.str2bool,
                        nargs='?',
                        const=True,
                        default=False,
                        help="Export SLO reports")
    parser.add_argument('--delete',
                        '-d',
                        type=utils.str2bool,
                        nargs='?',
                        const=True,
                        default=False,
                        help="Delete SLO (use for backends with APIs).")
    parser.add_argument('--timestamp',
                        '-t',
                        type=int,
                        default=None,
                        help="End timestamp for query.")
    return parser.parse_args(args)


if __name__ == '__main__':
    main()
