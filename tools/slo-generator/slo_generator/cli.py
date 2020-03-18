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
import glob
import logging
import os
import sys

from slo_generator.compute import compute
import slo_generator.utils as utils

LOGGER = logging.getLogger(__name__)


def main():
    """slo-generator CLI entrypoint."""
    utils.setup_logging()
    args = parse_args(sys.argv[1:])
    export = args.export

    # Load error budget policy
    error_budget_path = utils.normalize(args.error_budget_policy)
    LOGGER.debug(f"Loading Error Budget config from {error_budget_path}")

    error_budget_policy = utils.parse_config(error_budget_path)

    # Parse SLO folder for configs
    slo_config = args.slo_config
    if os.path.isfile(slo_config):
        slo_config_paths = [args.slo_config]
    else:
        slo_config_folder = utils.normalize(slo_config)
        slo_config_paths = glob.glob(f'{slo_config_folder}/slo_*.yaml')

    # Abort if configs are not found
    if not slo_config_paths:
        LOGGER.error(f'No SLO configs found in SLO folder {slo_config_folder}.')

    # Load SLO configs and compute SLO reports
    for cfg in slo_config_paths:
        slo_config_path = utils.normalize(cfg)
        LOGGER.debug(f'Loading SLO config from {slo_config_path}')
        slo_config = utils.parse_config(slo_config_path)
        compute(slo_config, error_budget_policy, do_export=export)


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
                        type=bool,
                        required=False,
                        default=False)
    return parser.parse_args(args)


if __name__ == '__main__':
    main()
