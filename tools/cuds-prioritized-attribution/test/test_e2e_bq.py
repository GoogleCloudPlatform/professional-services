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

import os
import sys
from collections import defaultdict

sys.path.append('../source')
# noinspection PyUnresolvedReferences,PyUnresolvedReferences,PyUnresolvedReferences,PyPep8
from main import execute_transformation_query, main
# noinspection PyPep8,PyUnresolvedReferences
from google.cloud import bigquery


# noinspection PyClassHasNoInit,SpellCheckingInspection
class TestBQ:

    @staticmethod
    def setup_class():
        """
        setup_class sets up the environment in the beginning.
        :return:
        """
        print("setup class:TestBQ")
        dataset = TestBQ.get_env_var('TEST_DATASET')
        myCmd = 'sh tests/load_all_test_data.sh ' + dataset
        print(myCmd)
        os.system(myCmd)

    @staticmethod
    def teardown_class():
        """
        Clean up test dataset after test is done
        :return:
        """
        print("teardown class:TestBQ")
        dataset = TestBQ.get_env_var('TEST_DATASET')
        myCmd = 'sh tests/clear_all.sh ' + dataset
        print(myCmd)
        os.system(myCmd)

    @staticmethod
    def get_env_var(key_name):
        return os.environ.get(key_name, 'Key name is not set')

    @staticmethod
    def set_env_var(key, value):
        """
        Sets environment variable.
        :param key:
        :param value:
        """
        os.environ[key] = value

    @staticmethod
    def get_output_results(test_case_no):
        """
        Calls the execute_transformation_query function from cud_correction_dag.py in source directory.
        :param test_case_no: It takes test case number so that it can be called for different test cases.
        :return: results of the "select" query
        """
        project_id = TestBQ.get_env_var('TEST_PROJECT_ID')
        TestBQ.set_env_var('project_id', project_id)

        billing_export_dataset_id = TestBQ.get_env_var('TEST_DATASET')
        TestBQ.set_env_var('billing_export_dataset_id',
                           billing_export_dataset_id)

        commitment_table_name = TestBQ.get_env_var(
            'TABLE_PREFIX') + test_case_no + "_commitments"
        TestBQ.set_env_var('commitment_table_name', commitment_table_name)

        billing_export_table_name = TestBQ.get_env_var(
            'TABLE_PREFIX') + test_case_no + "_export"
        TestBQ.set_env_var('billing_export_table_name',
                           billing_export_table_name)

        distribute_commitments_query = TestBQ.get_env_var(
            'DISTRIBUTE_COMMITMENTS_QUERY')
        TestBQ.set_env_var('distribute_commitments_query',
                           distribute_commitments_query)

        corrected_billing_query = TestBQ.get_env_var('CORRECTED_BILLING_QUERY')
        TestBQ.set_env_var('corrected_billing_query', corrected_billing_query)

        distribute_commitment_table = TestBQ.get_env_var(
            'DISTRIBUTE_COMMITMENT_TABLE')
        distribute_commitment_table = distribute_commitment_table + test_case_no
        TestBQ.set_env_var('distribute_commitment_table',
                           distribute_commitment_table)

        corrected_dataset_id = TestBQ.get_env_var('OUTPUT_TEST_DATASET')
        TestBQ.set_env_var('corrected_dataset_id', corrected_dataset_id)

        output_table_name = TestBQ.get_env_var('OUTPUT_TABLE_PREFIX')
        output_table_name = output_table_name + test_case_no
        TestBQ.set_env_var('corrected_table_name', output_table_name)

        main("", "")

        results = TestBQ.select_from_table(corrected_dataset_id,
                                           output_table_name)
        return results

    @staticmethod
    def select_from_table(dataset_id, table_name):
        """
        Method to run a "select" query from a table and returns results.
        :param dataset_id:
        :param table_name:
        :return:
        """
        client = bigquery.Client()
        select_sql = "select * from " + dataset_id + '.' + table_name
        query_job = client.query(select_sql)
        result = query_job.result()
        return result

    @staticmethod
    def fill_up_map_from_result(results, credit_type):
        """
        This method takes results and credit type parameters. Results can come from previous function after running query.
        :param results: query results
        :param credit_type: e.g. CUD, SUD
        :return: project credit map
        """
        project_credit_all = defaultdict(float)
        project_cost_all = defaultdict(float)
        total_credit = 0

        for row in results:
            # noinspection PyShadowingBuiltins
            credits = row['credits']
            sku = (row['sku'])
            sku_id = sku['id']
            output_project_id = row['project']['id']
            output_region = row['location']['region']
            output_start_time = str(row['usage_start_time'])
            output_start_date = output_start_time.split(' ')[0]

            output_cost_amount = row['cost']

            if (credit_type in sku_id) and ('CREDIT' in sku_id):

                for item in credits:
                    output_credit_amount = item['amount']

                    total_credit += output_credit_amount

                    output_credit_name = item['name']

                    # noinspection PyPep8
                    project_credit_name = output_project_id + '_' + output_region + '_' \
                                          + output_credit_name + '_' + output_start_date

                    project_credit_all[
                        project_credit_name] += output_credit_amount

            if (credit_type in sku_id) and ('COST' in sku_id):

                project_cost_name = output_project_id + '_' + output_region + '_' + output_start_date
                project_cost_all[project_cost_name] += output_cost_amount

        print("project credit map is: "), project_credit_all
        print("total credit is : ", total_credit)
        print("Cost map is: ", project_cost_all)

        project_credit_data = (total_credit, project_credit_all,
                               project_cost_all)
        return project_credit_data

    @staticmethod
    def get_output_map(test_case_no, credit_type):
        """
        This function takes credit type and test case number and returns project credit map
        :param test_case_no: test scenario number
        :param credit_type: e.g. CUD/SUD
        :return:
        """
        results = TestBQ.get_output_results(test_case_no)
        project_credit_data = TestBQ.fill_up_map_from_result(
            results, credit_type)
        total_credit, project_credit_all, project_cost_all = project_credit_data
        output_project_credit_data = (total_credit, project_credit_all,
                                      project_cost_all)
        return output_project_credit_data

    @staticmethod
    def get_expected_output_map(test_case_no, credit_type):
        """
        Get expected project credit map
        :param test_case_no:
        :param credit_type:
        :return:
        """
        dataset_id = TestBQ.get_env_var('TEST_DATASET')
        table_name = TestBQ.get_env_var(
            'TABLE_PREFIX') + test_case_no + "_expected"
        results = TestBQ.select_from_table(dataset_id, table_name)
        project_credit_data = TestBQ.fill_up_map_from_result(
            results, credit_type)
        total_credit, project_credit_all, project_cost_all = project_credit_data
        expected_project_credit_data = (total_credit, project_credit_all,
                                        project_cost_all)
        return expected_project_credit_data

    # noinspection PyUnresolvedReferences
    def test_project_credit_cost_sum(self, testcasename):
        """
        Parameterized test case function. It will run as many times as there are test cases passed by
        testcasename parameter. testcasename parameter is set by conftest.pytest_generate_tests(metafunc) function.
        :param testcasename:
        :return:
        """
        credit_type = TestBQ.get_env_var('CREDIT_TYPE')
        output_project_credit_data = TestBQ.get_output_map(
            testcasename, credit_type)
        total_credit, project_credit_all, project_cost_all = output_project_credit_data
        expected_project_credit_data = TestBQ.get_expected_output_map(
            testcasename, credit_type)
        total_credit, expected_credit_map, expected_cost_map = expected_project_credit_data
        assert (total_credit == 0)
        assert cmp(project_credit_all, expected_credit_map) == 0
        assert cmp(project_cost_all, expected_cost_map) == 0
