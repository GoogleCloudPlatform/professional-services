# Copyright 2019 Google Inc.
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#         http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.

"""DAG Quality tests."""

import os
import time
import unittest

from airflow.models import DagBag, Variable


class TestDagIntegrity(unittest.TestCase):
    """Tests DAG Syntax, compatibility with environment and load time."""
    LOAD_SECOND_THRESHOLD = 2

    def setUp(self):
        """Setup dagbag for each test."""
        self.dagbag = DagBag(
            dag_folder=os.environ.get('AIRFLOW_HOME', "~/airflow/")+'/dags/',
            include_examples=False)

    def test_import_dags(self):
        """Tests there are no syntax issues or environment compaibility issues.
        """
        self.assertFalse(
            len(self.dagbag.import_errors),
            'DAG import failures. Errors: {}'.format(
                self.dagbag.import_errors
            )
        )

    def test_import_time(self):
        """Test that all DAGs can be parsed under the threshold time."""
        for dag_id in self.dagbag.dag_ids:
            start = time.time()

            dag_file = dag_id + ".py"
            self.dagbag.process_file(dag_file)

            end = time.time()
            total = end - start

            self.assertLessEqual(total, self.LOAD_SECOND_THRESHOLD)


if __name__ == "__main__":
    unittest.main()
