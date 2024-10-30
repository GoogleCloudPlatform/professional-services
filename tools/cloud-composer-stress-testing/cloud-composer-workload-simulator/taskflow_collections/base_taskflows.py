"""
BaseTaskFlows class for default task flows.
"""


class BaseTaskFlows:
    """
    Base Taskflow class with default functions for DAG generation.
    """

    def __init__(self, dag_id):
        """
        Initializes BaseTaskflow with DAG ID.
        """
        self.dag_id = dag_id
        self.taskflows = [
            "PythonOperator",
            "KubernetesPodOperator",
            "BashOperator",
            "BranchPythonOperator",
            "EmptyOperator",
        ]

    @staticmethod
    def add_imports():
        """generate string fo default imports"""

        return f"""

# -------------------------------------------------
# Base Taskflow Imports 
# -------------------------------------------------

from datetime import datetime, timedelta
from airflow import DAG
from airflow.operators.python import (
    PythonOperator,
    BranchPythonOperator,
)
from airflow.providers.cncf.kubernetes.operators.kubernetes_pod import KubernetesPodOperator
from airflow.operators.bash import BashOperator
from airflow.operators.empty import EmptyOperator
"""

    def generate_tasks(self, task_number, taskflow_name) -> str:
        """ """
        tasks_string = ""

        if taskflow_name == "PythonOperator":
            tasks_string = self.pythonoperator_taskflow(task_id=task_number)

        elif taskflow_name == "KubernetesPodOperator":
            tasks_string = self.kubernetespodoperator_taskflow(task_id=task_number)

        elif taskflow_name == "BashOperator":
            tasks_string = self.bashoperator_taskflow(task_id=task_number)

        elif taskflow_name == "BranchPythonOperator":
            tasks_string += self.pythonbranchoperator_taskflow(
                task_id=task_number,
            )

        elif taskflow_name == "EmptyOperator":
            tasks_string = self.emptyoperator_taskflow(task_id=task_number)

        return tasks_string

    def pythonoperator_taskflow(
        self,
        task_id: str,
    ):
        """Generates Taskflow for PythonOperator."""
        return f"""
    # -------------------------------------------------
    # Default PythonOperator Taskflow 
    # -------------------------------------------------
        
    task_{task_id} = PythonOperator(
        task_id="python_{task_id}",
        python_callable=lambda: print(f"Hello World from DAG: {self.dag_id}, Task: {task_id}"),
    )
    """

    def pythonbranchoperator_taskflow(self, task_id: str):
        """Generates Taskflow for PythonBranchOperator."""
        return f"""
    # -------------------------------------------------
    # Default PythonBranchOperator Taskflow 
    # -------------------------------------------------

    def choose_branch(**kwargs):
        execution_date = kwargs['execution_date']
        if execution_date.day % 2 == 0:
            return 'even_day_task_{task_id}'
        else:
            return 'odd_day_task_{task_id}'

    # Define the BranchPythonOperator
    task_{task_id} = BranchPythonOperator(
        task_id='branch_task_{task_id}',
        python_callable=choose_branch,
        provide_context=True,
    )

    # Define tasks for each branch
    even_day_task_{task_id}  = EmptyOperator(task_id='even_day_task_{task_id}')
    odd_day_task_{task_id}  = EmptyOperator(task_id='odd_day_task_{task_id}')

    # Define task dependencies
    task_{task_id}  >> even_day_task_{task_id}
    task_{task_id}  >> odd_day_task_{task_id}
    """

    def kubernetespodoperator_taskflow(
        self,
        task_id: str,
    ):
        """Generates Taskflow for KubernetesPodOperator."""
        return f"""
    # -------------------------------------------------
    # Default KubernetesPodOperator Taskflow 
    # -------------------------------------------------

    task_{task_id} = KubernetesPodOperator(
        task_id="kubernetes_task_{task_id}",
        name="pod-ex-minimum",
        cmds=["echo"],
        namespace="composer-user-workloads",
        image="gcr.io/gcp-runtimes/ubuntu_20_0_4",
        config_file="/home/airflow/composer_kube_config",
        kubernetes_conn_id="kubernetes_default",
    )
    """

    def bashoperator_taskflow(self, task_id: str):
        """Generates Taskflow for BashOperator."""
        return f"""
    # -------------------------------------------------
    # Default BashOperator Taskflow 
    # -------------------------------------------------

    task_{task_id} = BashOperator(
        task_id="bash_task_{task_id}",
        bash_command="echo 'Hello from BashOperator'",
    )
    """

    def emptyoperator_taskflow(self, task_id: str):
        """Generates Taskflow for EmptyOperator."""
        return f"""
    # -------------------------------------------------
    # Default EmptyOperator Taskflow 
    # -------------------------------------------------

    task_{task_id} = EmptyOperator(
        task_id=f"empty_task_{task_id}",
    )
    """
