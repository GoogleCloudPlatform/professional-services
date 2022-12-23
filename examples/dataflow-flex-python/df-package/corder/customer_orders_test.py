# Copyright 2022 Google, LLC.
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#    http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.

import glob
import logging
import os

from apache_beam.testing.test_pipeline import TestPipeline
from apache_beam.testing.test_utils import TempDir
import pytest

from corder import customer_orders


def test_xml_to_bq():
    test_pipeline = TestPipeline()

    with TempDir() as temp_dir:
        input_file = os.path.join("../../sample-data", "customer-orders.xml")
        output_file = os.path.join(temp_dir.get_path(), "example.json")
        extra_opts = {
            'input': input_file,
            'output': output_file,
            'dead_letter_dir': temp_dir.get_path()
        }
        customer_orders.run(
            test_pipeline.get_full_options_as_args(**extra_opts))
        output_files = glob.glob(output_file + '*')
        for file_name in output_files:
            if "order" in file_name:
                lines = open(file_name).read().splitlines()
                assert len(lines) == 22
            if "customer" in file_name:
                lines = open(file_name).read().splitlines()
                assert len(lines) == 4


if __name__ == '__main__':
    logging.getLogger().setLevel(logging.INFO)
    pytest.main()
