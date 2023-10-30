# Copyright 2023 Google LLC
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
DAG to scope the estimated work effort for an Airflow 1 to Airflow 2 Migration.
Collects airflow metadata for inventory, runs diagnostic tools, outputs all
to a Google Cloud Storage location and generates a final migration assessment.
"""

import time
import os
import json
from datetime import datetime, timedelta
from google.cloud import storage
import pandas as pd
from dominate import document
from dominate.tags import h1, h2, h3, pre, p, ul, li, style

from airflow import models
from airflow.operators.bash_operator import BashOperator
from airflow.contrib.operators.mysql_to_gcs import MySqlToGoogleCloudStorageOperator
from airflow.operators.python_operator import PythonOperator

GCS_BUCKET = "your-bucket-name"

default_args = {
    "owner": "auditing",
    "depends_on_past": False,
    "email": [""],
    "email_on_failure": False,
    "email_on_retry": False,
    "retries": 1,
    "retry_delay": timedelta(minutes=2),
}

# -------------------------
# Callback Functions
# -------------------------
def full_migration_complexity(**context):
    """
    Read files from GCS and compute a migration complexity
    """

    # Instantiate a Google Cloud Storage client and specify required bucket and file
    storage_client = storage.Client()
    bucket = storage_client.get_bucket(context["templates_dict"]["gcs_bucket"])
    root_path = context["templates_dict"]["gcs_root_path"]

    work_estimate_blob = bucket.blob(f"{root_path}/work_estimate.json")
    work_estimate_text = work_estimate_blob.download_as_text()

    # -------------------------------------------------------------------------
    # Retrieve ruleset of operators that can be converted automatically vs
    # manually
    # -------------------------------------------------------------------------

    rules_blob = bucket.blob(f"{root_path}/v1-to-v2-report/rules.csv")
    rules_blob.download_to_filename("rules.csv")
    rules_df = pd.read_csv("rules.csv")
    manuals = rules_df.loc[rules_df["Manual Intervention"] == True, "Operator"].tolist()
    automated = rules_df.loc[
        rules_df["Manual Intervention"] == False, "Operator"
    ].tolist()

    # -------------------------------------------------------------------------
    # using the ruleset and the original work estimate, generate metrics on how
    # many dags, tasks, hours, automatic conversions, manual interventions, and
    # tasks that need review.
    # -------------------------------------------------------------------------

    tasks = work_hours = num_dags = num_converts = num_interventions = num_reviews = 0
    unique_operators = set()
    unique_interventions = set()
    unique_conversions = set()
    unique_reviews = set()

    for line in work_estimate_text.splitlines():
        entry = json.loads(line)
        num_dags += 1
        work_hours += int(entry["work_hours_estimate"])
        tasks += int(entry["tasks"])

        for operator in str(entry["list_of_all_operators"]).split(","):
            if operator in manuals:
                num_interventions += 1
            elif operator in automated:
                num_converts += 1
            else:
                num_reviews += 1

        for operator in str(entry["list_of_unique_operators"]).split(","):
            unique_operators.add(operator)
            if operator in manuals:
                unique_interventions.add(operator)
            elif operator in automated:
                unique_conversions.add(operator)
            else:
                unique_reviews.add(operator)

    # -------------------------------------------------------------------------
    # Calculate the new work estimate
    # -------------------------------------------------------------------------

    new_work_hours = round(work_hours - (num_converts / tasks * work_hours) / 2, 2)
    effort_reduction = round((1 - new_work_hours / work_hours) * 100, 2)

    # -------------------------------------------------------------------------
    # Build the final report HTML file
    # -------------------------------------------------------------------------

    upgrade_check_blob = bucket.blob(f"{root_path}/upgrade-check/results")
    upgrade_check_data = upgrade_check_blob.download_as_text()

    summary_blob = bucket.blob(f"{root_path}/v1-to-v2-report/Summary-Report.txt")
    summary_data = summary_blob.download_as_text()

    detailed_summary_blob = bucket.blob(
        f"{root_path}/v1-to-v2-report/Detailed-Report.txt"
    )
    detailed_summary_data = detailed_summary_blob.download_as_text()

    with document(title="Migration Complexity Assessment") as doc:
        style(
            """
            body {
              font-family: math;
            }
        """
        )
        h1("Composer Migration Complexity Assessment")
        h2("Summary")
        p(f"Original Total Work Hours Estimate: {str(work_hours)}")
        p(f"Number of Active DAGs: {str(num_dags)}")

        h3("All Tasks")
        p(f"{str(tasks)} total task(s) consisting of these unique operator types:")
        uo_list = ul()
        for item in list(unique_operators):
            uo_list += li(item)

        h3("Automated Conversions")
        p(
            f"{str(num_converts)} task(s) automatically converted consisting of these unique operator types:"
        )
        c_list = ul()
        for item in list(unique_conversions):
            c_list += li(item)

        h3("Manual Interventions")
        p(
            f"{str(num_interventions)} task(s) require manual intervention consisting of these unique operator types:"
        )
        i_list = ul()
        for item in list(unique_interventions):
            i_list += li(item)

        h3("Need Review")
        p(
            f"{str(num_reviews)} task(s) need review consisting of these unique operator types:"
        )
        r_list = ul()
        for item in unique_reviews:
            r_list += li(item)

        h3("New Work Estimate")
        p(f"Total Work Hours: {str(new_work_hours)}")
        p(f"{effort_reduction}% change in estimated work hours.")
        p("formula: original_hours-(converted_tasks/total_tasks*original_hours)/2")

        h2("Tooling Logs")
        h3("Google PSO Airflow V1 to V2")
        p(
            "The objective of the tool is to automate the upgrade of DAG files from Composer-v1 (Airflow 1.x) to Composer-v2 (Airflow 2.x). This process involves handling changes in import statements, operators, and their arguments. By automating the migration, the tool saves time, ensures consistency, reduces errors, and minimizes administrative overhead associated with manual upgrades."
        )

        pre(str(summary_data))
        pre(str(detailed_summary_data))

        h3("Airflow Upgrade Check")
        p(
            "This shows a number of action items that you should follow before upgrading to 2.0.0 or above."
        )
        pre(str(upgrade_check_data))

    with open("full_migration_complexity.html", "w") as html_file:
        html_file.write(doc.render())

    res_blob = bucket.blob(f"{root_path}/full_migration_complexity.html")
    res_blob.upload_from_filename("full_migration_complexity.html")


# -------------------------------------------------------------------------
# Begin creating DAG
# -------------------------------------------------------------------------

with models.DAG(
    "test_airflow_migration_assessment_v1_0",
    tags=["airflow_migration_assessment"],
    description="assess migration scope for airflow v1 to v2",
    is_paused_upon_creation=True,
    catchup=False,
    start_date=datetime(2023, 8, 10),
    dagrun_timeout=timedelta(minutes=30),
    max_active_runs=1,
    default_args=default_args,
    schedule_interval="0 0 * * *",  # daily at 00:00
) as dag:

    TIMESTAMP = time.strftime("%Y%m%d")
    AIRFLOW_HOME_DIR = os.environ["DAGS_FOLDER"]
    GCS_ROOT_PATH = f"migration-assessment/{TIMESTAMP}"

    # -----------------------------------
    # Collect Inventory from Airflow DB
    # -----------------------------------

    dag_query = """
        SELECT 
            *, 
            {processed_ts} as processed_ts
        FROM dag
        WHERE
            is_active=1
    """.format(
        processed_ts=TIMESTAMP
    )

    collect_dag_inventory = MySqlToGoogleCloudStorageOperator(
        task_id="collect_dag_inventory",
        mysql_conn_id="airflow_db",
        provide_context=True,
        sql=dag_query,
        bucket=GCS_BUCKET,
        filename=f"migration-assessment/{TIMESTAMP}/inventory/dags.json",
    )

    task_instance_query = """
        SELECT 
            DISTINCT
                ti.dag_id, 
                operator,
                {processed_ts} as processed_ts
        FROM task_instance ti
        JOIN dag d on d.dag_id = ti.dag_id
        WHERE d.is_active=1
    """.format(
        processed_ts=TIMESTAMP
    )

    collect_task_inventory = MySqlToGoogleCloudStorageOperator(
        task_id="collect_task_inventory",
        mysql_conn_id="airflow_db",
        provide_context=True,
        sql=task_instance_query,
        bucket=GCS_BUCKET,
        filename=f"migration-assessment/{TIMESTAMP}/inventory/tasks.json",
    )

    operator_query = """
        SELECT 
            ti.operator,
            count(ti.dag_id) as occurrences,
            {processed_ts} as processed_ts
        FROM 
            (SELECT distinct dag_id, operator
            FROM task_instance) ti
        INNER JOIN dag as d ON d.dag_id = ti.dag_id
        WHERE d.is_active=1
        GROUP BY ti.operator
    """.format(
        processed_ts=TIMESTAMP
    )

    collect_operator_inventory = MySqlToGoogleCloudStorageOperator(
        task_id="collect_operator_inventory",
        mysql_conn_id="airflow_db",
        provide_context=True,
        sql=operator_query,
        bucket=GCS_BUCKET,
        filename=f"migration-assessment/{TIMESTAMP}/inventory/operators.json",
    )

    # -----------------------------------
    # Run Upgrade Check and Output to GCS
    # -----------------------------------

    # update this to the recommended documentation
    upgrade_cmds = """
        rm -rf upgrade-check
        mkdir -p upgrade-check
        airflow upgrade_check > upgrade-check/results
        gsutil cp -r upgrade-check gs://{bucket}/{root_path}/
    """.format(
        bucket=GCS_BUCKET, root_path=GCS_ROOT_PATH
    )

    run_upgrade_check = BashOperator(
        task_id="run_upgrade_check",
        bash_command=upgrade_cmds,
    )

    # -----------------------------------
    # Run Airflow v1 to v2 Migration code
    # -----------------------------------

    v1_to_v2_cmds = """
    rm -rf v1-to-v2-report
    mkdir -p v1-to-v2-report
    cp {root_dir}/airflow-v1-to-v2-migration/migration_rules/rules.csv v1-to-v2-report/rules.csv
    python3 {root_dir}/airflow-v1-to-v2-migration/run_mig.py --input_dag_folder={root_dir} --output_dag_folder=v1-to-v2-report --rules_file={root_dir}/airflow-v1-to-v2-migration/migration_rules/rules.csv
    gsutil cp -r v1-to-v2-report gs://{gcs_bucket}/{root_path}/
    gsutil rm gs://{gcs_bucket}/{root_path}/v1-to-v2-report/*.py
     """.format(
        root_dir=AIRFLOW_HOME_DIR, gcs_bucket=GCS_BUCKET, root_path=GCS_ROOT_PATH
    )

    run_airflow_v1_to_v2 = BashOperator(
        task_id="run_airflow_v1_to_v2",
        bash_command=v1_to_v2_cmds,
    )

    # -----------------------------------
    # Run Work Estimate
    # -----------------------------------

    work_estimate_query = """
    SELECT 
        dag_id,
        dag_size,
        complexity_score,
        CASE
            WHEN complexity_score <= 100 THEN 'Simple'
            WHEN complexity_score > 100 AND complexity_score < 5000 THEN 'Medium'
            ELSE 'Complex'
        END as complexity,
        CASE
            WHEN complexity_score <= 100 THEN 1
            WHEN complexity_score > 100 AND complexity_score < 5000 THEN 2
            ELSE 4
        END as work_hours_estimate,
        unique_operators,
        list_of_unique_operators,
        tasks,
        list_of_all_operators,
        {processed_ts} as processed_ts
    FROM 
    (SELECT 
        sd.dag_id, 
        length(data) as dag_size, 
        uo.unique_operators,
        uo.list_of_unique_operators,
        uo.list_of_all_operators,
        tasks,
        round((tasks * uo.unique_operators) * length(data) / 10000, 2) as complexity_score
    FROM serialized_dag sd 
    JOIN (
        SELECT distinct
            dag_id, 
            count(distinct operator, dag_id) AS unique_operators,
            group_concat(distinct operator) as list_of_unique_operators,
            group_concat(operator) as list_of_all_operators
        FROM task_instance GROUP BY dag_id, execution_date) uo
        ON sd.dag_id = uo.dag_id
    JOIN (
        SELECT 
            dag_id, 
            count(distinct dag_id, task_id) AS tasks 
        FROM task_instance GROUP BY dag_id
        ) t
        ON sd.dag_id = t.dag_id
    ) c
    """.format(
        processed_ts=TIMESTAMP
    )

    generate_work_estimate = MySqlToGoogleCloudStorageOperator(
        task_id="generate_work_estimate",
        mysql_conn_id="airflow_db",
        provide_context=True,
        sql=work_estimate_query,
        bucket=GCS_BUCKET,
        filename=f"migration-assessment/{TIMESTAMP}/work_estimate.json",
    )

    full_migration_complexity_task = PythonOperator(
        task_id="full_migration_complexity",
        python_callable=full_migration_complexity,
        provide_context=True,
        templates_dict={"gcs_bucket": GCS_BUCKET, "gcs_root_path": GCS_ROOT_PATH},
    )

    [
        collect_dag_inventory,
        collect_task_inventory,
        collect_operator_inventory,
        run_upgrade_check,
        run_airflow_v1_to_v2,
        generate_work_estimate,
    ] >> full_migration_complexity_task
