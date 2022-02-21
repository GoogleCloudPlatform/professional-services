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
This module represents the entry point for interfacing with the tool from
the command line where it exposes the different arguments / parameters and
executes xsd2bq module.
"""
import json
import logging
import argparse
from xsd2bq.xsd2bq import convert_xsd

console = logging.StreamHandler()
console.setLevel(logging.INFO)
formatter = logging.Formatter('%(levelname)-8s %(message)s')
console.setFormatter(formatter)
logging.getLogger('').addHandler(console)


def main() -> None:
    parser = argparse.ArgumentParser(
        description=
        'Utility for generating a BigQuery Schema based on an XSD Schema')
    parser.add_argument('--root',
                        required=True,
                        help='The root / parent XSD tag to start from')
    parser.add_argument('--xsd_file',
                        required=True,
                        help='The path to an XSD Schema file')

    args = parser.parse_args()

    try:
        print(json.dumps(convert_xsd(args.root, args.xsd_file)))
    except ValueError as e:
        logging.error(e)
