import json
import os
from pathlib import Path
from unittest import mock

import pytest

from airflow.models import DagBag


AIRFLOW_PATH = Path(__file__).parent.parent


@pytest.fixture(scope="session")
def dagbag():
    return DagBag(dag_folder=(AIRFLOW_PATH / "dags"), include_examples=False)


@pytest.mark.parametrize(
    "dag_id",
    [
        "sftp_ingestion",
        "teradata_ingestion",
        "oracle_ingestion",
    ],
)
def test_dag_loaded(dagbag, dag_id):
    dag = dagbag.get_dag(dag_id=dag_id)
    assert dagbag.import_errors == {}
    assert dag is not None
