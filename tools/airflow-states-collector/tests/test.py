import unittest
from src.utils import read_file
from src.lookerstudioservice import LookerStudioService
from airflow_states_collector import get_dag_from_template
import os

class TestMethods(unittest.TestCase):

  def test_read_file(self):
    filepath = os.path.dirname(os.path.abspath(__file__)) + f"/resources{os.sep}test_queries{os.sep}test.sql"
    expected_output = "SELECT * FROM `{{ PROJECT }}.{{ DATASET }}.{{ TABLE }}`;"
    self.assertEqual(read_file(filepath), expected_output)

  def test_lookerurl(self):
    ds_configs = {
        "ds.ds21.datasourceName" : "airflow_merged_view",
        "ds.ds21.billingProjectId" : "test-project",
        "ds.ds21.projectId" : "test-project",
        "ds.ds21.datasetId" : "test-dataset",
        "ds.ds21.tableId" : "test-table"
    }

    lookerstudio = LookerStudioService(template_report_id="16565de7-3f5d-4a3f-87e9-5ff407dc0324",
                                     new_report_name="LookerDashboard",
                                     datasources_config=ds_configs)
    expected_output_url = "https://lookerstudio.google.com/reporting/create?c.reportId=16565de7-3f5d-4a3f-87e9-5ff407dc0324&r.reportName=LookerDashboard&ds.ds21.datasourceName=airflow_merged_view&ds.ds21.billingProjectId=test-project&ds.ds21.projectId=test-project&ds.ds21.datasetId=test-dataset&ds.ds21.tableId=test-table"
    self.assertEqual(lookerstudio.get_copy_report_url(), expected_output_url)

  def test_dag_content(self):
    self.maxDiff = None
    input_filepath = os.path.dirname(os.path.abspath(__file__)) + f"/resources{os.sep}airflow{os.sep}template{os.sep}dagtemplate_airflow_v1.txt"
    expected_outputfilepath = os.path.dirname(os.path.abspath(__file__)) + f"/resources{os.sep}airflow{os.sep}output{os.sep}dag_airflow_states_collector.py"
    dag_variables = {
        "BQ_PROJECT" : "test-project",
        "BQ_AUDIT_DATASET" : "test-dataset",
        "BQ_AUDIT_TABLE" : "test-table",
        "SCHEDULE_INTERVAL" : "*/5 * * * *",
        "CURRENT_DAG_ID" : "test-dagid",
        "LAST_NDAYS" : 5,
        "SKIP_DAG_LIST" : [''],
        "INSERT_QUERY_BATCH_SIZE" : 150
    }
    dag_output = get_dag_from_template(input_filepath, dag_variables)
    expected_output = read_file(expected_outputfilepath)
    self.assertEqual(dag_output, expected_output)

if __name__ == '__main__':
  unittest.main()