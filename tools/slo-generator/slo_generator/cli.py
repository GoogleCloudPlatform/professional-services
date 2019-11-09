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
import yaml
import logging
import sys

from slo_generator.compute import compute
import slo_generator.utils as utils

logging.basicConfig(
    stream=sys.stdout,
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    datefmt='%m/%d/%Y %I:%M:%S')
logging.getLogger('googleapiclient').setLevel(logging.ERROR)
LOGGER = logging.getLogger(__name__)


def main():
    args = parse_args(sys.argv[1:])
    slo_config_path = utils.normalize(args.slo_config)
    error_budget_path = utils.normalize(args.error_budget_policy)
    export = args.export
    LOGGER.info("Loading SLO config from %s" % slo_config_path)
    LOGGER.info("Loading Error Budget config from %s" % error_budget_path)

    with open(slo_config_path, 'r') as f:
        slo_config = yaml.safe_load(f)

    with open(error_budget_path, 'r') as f:
        error_budget_policy = yaml.safe_load(f)

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
                        type=str,
                        required=False,
                        default='slo.json',
                        help='JSON configuration file')
    parser.add_argument('--error-budget-policy',
                        type=str,
                        required=False,
                        default='error_budget_policy.json',
                        help='JSON configuration file')
    parser.add_argument('--export', type=bool, required=False, default=False)
    return parser.parse_args(args)


if __name__ == '__main__':
    main()
