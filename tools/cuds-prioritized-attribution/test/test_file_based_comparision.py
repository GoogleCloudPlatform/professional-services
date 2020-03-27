# Copyright 2020 Google LLC
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#      http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.

from helper import Helper
import filecmp
import pytest
import os
import logging

data = {
    'project_id': os.environ['project_id'],
    'corrected_dataset_id': os.environ['corrected_dataset_id'],
    'corrected_table_name': '',
    'project_label_credit_breakout_table': '',
    'distribute_commitments_table': '',
    'billing_export_dataset_id': os.environ['billing_export_dataset_id'],
    'billing_export_table_name': '',
    'load_billing_export_table_name': '',
    'commitment_table_name': '',
    'enable_cud_cost_attribution': os.environ['enable_cud_cost_attribution']
}

test_directory = next(os.walk("tests/"))[1]
test_directory.sort()

print("\n" + 'Preparing test environment ... ' + "\n")
Helper.create_dataset(data['corrected_dataset_id'])


@pytest.mark.parametrize("dir", test_directory)
def test_eval(dir):
    seperator = "*" * 60
    print("\n" + seperator)
    print("Testing test case " + dir)
    data['corrected_table_name'] = dir + "_corrected"
    data['distribute_commitments_table'] = dir + "_distribute_commitment"
    data['corrected_table_name'] = dir + "_corrected"
    data['billing_export_table_name'] = data[
        'corrected_dataset_id'] + '.' + dir + "_export"
    data['load_billing_export_table_name'] = dir + "_export"
    data['commitment_table_name'] = dir + "_commitment"
    data['temp_commitments_table_name'] = dir + "_commitment"
    data['project_label_credit_breakout_table'] = dir + "_project_label_credit"

    Helper.prepare_consolidated_billing(dir, data)
    Helper.dump_result(data['project_id'], data['corrected_dataset_id'],
                       data['corrected_table_name'], "tests/" + dir)
    retVal = filecmp.cmp("tests/" + dir + "/output_cmp.json",
                         "tests/" + dir + "/expected_output.json",
                         shallow=False)

    assert retVal == True

    try:
        assert retVal == True
        Helper.clean(dir, data)
        print("\n" + 'Test case ' + dir + ' ... PASSED')
    except AssertionError as e:
        print("\n" + 'Test case ' + dir + ' ... FAILED')
