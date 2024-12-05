# Copyright 2024 Google LLC

# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at

# https://www.apache.org/licenses/LICENSE-2.0

# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.

import os
import logging
import unittest
import re
import ast
from datetime import timedelta
from airflow.models import DagBag
from airflow.utils.dag_cycle_tester import check_cycle

logger = logging.getLogger()
logger.setLevel(logging.INFO)
logging.basicConfig(format="%(asctime)s %(message)s")


def has_top_level_code(file_path):
    """Check to see if a file has top level functions defined"""
    with open(file_path, "r") as file:
        try:
            parsed_code = ast.parse(file.read())
            for node in parsed_code.body:
                if isinstance(node, (ast.FunctionDef)):
                    return False
            return True
        except SyntaxError:
            # Syntax error in the file, it doesn't have top-level code
            logger.info("Syntax Error")
            return True


class TestDagIntegrity(unittest.TestCase):
    """
    Class that holds all DAG Integrity tests.
    """

    LOAD_SECOND_THRESHOLD = 2
    MIN_RETRY = 1
    MAX_RETRY = 4

    def setUp(self):
        dags_dir = os.getenv("INPUT_DAGPATHS", default="dags/")
        logger.info(f"DAGs dir : {dags_dir}")
        self.dagbag = DagBag(dag_folder=dags_dir, include_examples=False)

    def test_no_import_errors(self):
        """Check to see if a DAG has import errors."""
        import_error = len(self.dagbag.import_errors) == 0
        error_msg = "DAG Import Errors."
        assert import_error, error_msg

    def test_dag_loads_within_threshold(self):
        """
        Check to see if a collection (bag) of DAGs will load faster than
        the specified threshold.
        """
        duration = sum(
            (o.duration for o in self.dagbag.dagbag_stats), timedelta()
        ).total_seconds()
        logger.info("Duration = " + str(duration))
        self.assertTrue(
            duration <= self.LOAD_SECOND_THRESHOLD,
            "DAG Bag load time is above the given threshold.",
        )

    def test_dag_task_cycle(self):
        """Check to see if a task cycle exists a DAG."""
        no_dag_found = True
        for dag in self.dagbag.dags:
            no_dag_found = False
            check_cycle(self.dagbag.dags[dag])  # Throws if a task cycle is found.

        if no_dag_found:
            raise AssertionError("Module does not contain a valid DAG")

    def test_dag_toplevelcode(self):
        """Check if DAG file has top level code."""
        for dag in self.dagbag.dags:
            fileloc = self.dagbag.dags[dag].fileloc
            if fileloc.endswith(".py"):
                error_msg = f"DAG {dag}: Top-level code exists."
                assert has_top_level_code(fileloc), error_msg

    def test_task_count(self):
        """Check task count for a DAG."""
        for dag in self.dagbag.dags:
            tasks = len(self.dagbag.dags[dag].tasks) > 0
            error_msg = f"DAG {dag}: doesn't have any tasks."
            assert tasks, error_msg

    def test_valid_schedule_interval(self):
        """Check to see if a DAG has a valid schedule interval."""
        valid_cron_expressions = re.compile(
            "(@(annually|yearly|monthly|weekly|daily|hourly|reboot))|(@every (\d+(ns|us|µs|ms|s|m|h))+)|((((\d+,)+\d+|([\d\*]+(\/|-)\d+)|\d+|\*) ?){5,7})"  # noqa
        )
        for dag in self.dagbag.dags:
            schedule = self.dagbag.dags[dag].schedule_interval
            if schedule:
                valid = re.match(valid_cron_expressions, str(schedule))
                error_msg = f"DAG {dag} has invalid cron expression or no schedule."
                assert valid, error_msg

    def test_owner_present(self):
        """Check to see if a DAG has an owner set in the default arguments."""
        for dag in self.dagbag.dags:
            owner = self.dagbag.dags[dag].default_args.get("owner")
            error_msg = f"DAG {dag}: owner not set in default_args."
            assert owner, error_msg

    def test_sla_present(self):
        """Check to see if a DAG has an SLA set in the default arguments."""
        for dag in self.dagbag.dags:
            sla = self.dagbag.dags[dag].default_args.get("sla")
            error_msg = f"DAG {dag}: sla not set in default_args."
            assert sla, error_msg

    def test_sla_less_than_timeout(self):
        """Check to see if a DAG has an SLA less than its dagrun_timeout."""
        for dag in self.dagbag.dags:
            sla = self.dagbag.dags[dag].default_args.get("sla")
            dagrun_timeout = self.dagbag.dags[dag].dagrun_timeout
            error_msg = f"DAG {dag}: sla is greater than dagrun_timeout."
            assert dagrun_timeout > sla, error_msg

    def test_retries_present(self):
        """Check to see if a DAG has retries set within a given range."""
        for dag in self.dagbag.dags:
            retries = self.dagbag.dags[dag].default_args.get("retries", [])
            error_msg = f"DAG {dag}: retries not set within specified range {self.MIN_RETRY}-{self.MAX_RETRY}."  # noqa
            assert retries >= self.MIN_RETRY and retries <= self.MAX_RETRY, error_msg

    def test_retry_delay_present(self):
        """Check to see if a DAG has a retry delay."""
        for dag in self.dagbag.dags:
            retry_delay = self.dagbag.dags[dag].default_args.get("retry_delay", [])
            error_msg = f"DAG {dag}: retry delay not set."
            assert retry_delay, error_msg

    def test_catchup_false(self):
        """Check to see if a DAG has catchup set to false."""
        for dag in self.dagbag.dags:
            catchup = self.dagbag.dags[dag].catchup
            error_msg = f"DAG {dag}: catchup not set to False."
            assert not catchup, error_msg

    def test_dag_timeout_set(self):
        """Check to see if a DAG has a timeout set."""
        for dag in self.dagbag.dags:
            dagrun_timeout = self.dagbag.dags[dag].dagrun_timeout
            error_msg = f"DAG {dag}: dagrun_timeout not set."
            assert dagrun_timeout, error_msg

    def test_dag_description_set(self):
        """Check to see if a DAG has a description set."""
        for dag in self.dagbag.dags:
            description = self.dagbag.dags[dag].description
            error_msg = f"DAG {dag}: description not set."
            assert description, error_msg

    def test_dag_paused_true(self):
        """Check to see if a DAG is paused on creation."""
        for dag in self.dagbag.dags:
            paused = self.dagbag.dags[dag].is_paused_upon_creation
            error_msg = f"DAG {dag}: paused not set to True."
            assert paused, error_msg

    def test_dag_has_tags(self):
        """Test if a DAG is tagged."""
        for dag in self.dagbag.dags:
            tags = self.dagbag.dags[dag].tags
            error_msg = f"DAG {dag}: no tags exist."
            assert len(tags) > 0, error_msg


if __name__ == "__main__":
    unittest.main()
