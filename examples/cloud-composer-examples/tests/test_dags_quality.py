# Copyright 2018 Google Inc.
#
# Licensed under the Apache License, Version 2.0 (the u"License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#            http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an u"AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.

"""
DAG Quality Tests

Tests all DAGs within an input DAG path directory.

Follow [Google Cloud Blog: Optimize Cloud Composer via Better Airflow DAGs](https://cloud.google.com/blog/products/data-analytics/optimize-cloud-composer-via-better-airflow-dags) - a guide containing a generalized checklist of activities when authoring Apache Airflow DAGs. 

[test_dags.py](https://github.com/CYarros10/google-cloud-composer/blob/main/airflow-dag-integrity/test_dags.py) enforces the following best practices from the guide above and provides many deprecation warnings:

* No Import Errors
* Valid Schedule Interval
* Owner Present
* SLA Present
* SLA Less Than Timeout
* Retries Present and value = 1-4
* Catchup Set to False by Default
* DAG Timeout set
* DAG Description set
* DAG Paused on Create
* DAG Valid Tags
* DAG Check Task Cycle
* DAG Import Time Less Than 2 Seconds
"""

import os
import time
import unittest
import logging as logger
from airflow.models import DagBag
from airflow.utils.dag_cycle_tester import check_cycle

_LOAD_SECONDS = 2

class TestDagQuality(unittest.TestCase):

  def setUp(self):
      DAGS_DIR = os.getenv('INPUT_DAGPATHS', default='sample-dags/') # either set INPUT_DAGPATHS externally or pass default here
      logger.info("DAGs dir : {}".format(DAGS_DIR))
      self.dagbag = DagBag(dag_folder = DAGS_DIR, include_examples = False)

  def test_no_import_errors(self):
    assert len(self.dagbag.import_errors) == 0, "No Import Failures"

  def test_valid_schedule_interval(self):
    import re
    valid_cron_expressions = re.compile("(@(annually|yearly|monthly|weekly|daily|hourly|reboot))|(@every (\d+(ns|us|µs|ms|s|m|h))+)|((((\d+,)+\d+|([\d\*]+(\/|-)\d+)|\d+|\*) ?){5,7})")
    for dag in self.dagbag.dags:
      schedule = self.dagbag.dags[dag].schedule_interval
      if schedule:
        valid = re.match(valid_cron_expressions, str(schedule))
        error_msg = f"DAG {dag} does not have a valid cron expression (or missing schedule)"
        assert valid, error_msg

  def test_owner_present(self):
    for dag in self.dagbag.dags:
        owner = self.dagbag.dags[dag].default_args.get('owner')
        error_msg = 'Owner not set for DAG {id}'.format(id=dag)
        assert owner, error_msg

  def test_sla_present(self):
    for dag in self.dagbag.dags:
        sla = self.dagbag.dags[dag].default_args.get('sla')
        error_msg = 'SLA not set for DAG {id}'.format(id=dag)
        assert sla, error_msg

  def test_sla_less_than_timeout(self):
    for dag in self.dagbag.dags:
        sla = self.dagbag.dags[dag].default_args.get('sla')
        dagrun_timeout = self.dagbag.dags[dag].dagrun_timeout
        error_msg = 'SLA is greater than timeout for DAG {id}'.format(id=dag)
        assert dagrun_timeout > sla, error_msg

  def test_retries_present(self):
    for dag in self.dagbag.dags:
        retries = self.dagbag.dags[dag].default_args.get('retries', [])
        error_msg = 'Retries not set to 1-4 for DAG {id}'.format(id=dag)
        assert retries > 0 and retries < 5, error_msg

  def test_catchup_false(self):
    for dag in self.dagbag.dags:
        catchup = self.dagbag.dags[dag].catchup
        error_msg = 'Catchup not set to False for DAG {id}'.format(id=dag)
        assert not catchup, error_msg

  def test_dag_timeout_set(self):
    for dag in self.dagbag.dags:
        dagrun_timeout = self.dagbag.dags[dag].dagrun_timeout
        error_msg = 'DAG Run Timeout not set for DAG {id}'.format(id=dag)
        assert dagrun_timeout, error_msg

  def test_dag_description_set(self):
    for dag in self.dagbag.dags:
        description = self.dagbag.dags[dag].description
        print(description)
        error_msg = 'Description not set for DAG {id}'.format(id=dag)
        assert description, error_msg

  def test_dag_paused_true(self):
    for dag in self.dagbag.dags:
        paused = self.dagbag.dags[dag].is_paused_upon_creation
        error_msg = 'Paused not set to True for DAG {id}'.format(id=dag)
        assert paused, error_msg

  def test_dag_has_tags(self):
      """
      test if a DAG is tagged and if those TAGs are in the approved list
      """
      for dag in self.dagbag.dags:
          tags = self.dagbag.dags[dag].tags
          error_msg = f"{dag} has no tags"
          assert len(tags)>0, error_msg

  def test_dag_task_cycle(self):
      no_dag_found = True
      for dag in self.dagbag.dags:
        no_dag_found = False
        check_cycle(self.dagbag.dags[dag])  # Throws if a task cycle is found.

      if no_dag_found:
          raise AssertionError("module does not contain a valid DAG")

  def test_import_time(self):
      """Test that all DAGs can be parsed under the threshold time."""
      path = self.dagbag.dag_folder
      dir_list = os.listdir(path)
      total = 0

      for dag_file in dir_list:
        start = time.time()
        self.dagbag.process_file(dag_file)
        end = time.time()
        total += end - start

      error_msg = f"DAG file {dag_file} not parsed under threshold time."
      assert total < _LOAD_SECONDS, error_msg

suite = unittest.TestLoader().loadTestsFromTestCase(TestDagQuality)