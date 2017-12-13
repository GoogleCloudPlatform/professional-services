# Copyright 2017 Google LLC All Rights Reserved.
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#     http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.

""""a remove_dag dag - removes a dag and its metadata .

    this is intended to be triggered via the commandline, e.g.:
    gcloud alpha composer environments run <envName> \
    trigger_dag -- cleanup_dag  --conf '{"parameter":"dag_name_to_clean" }'

    NOTE for GCLoud users: this currently does not remove the dag from the GCS dag bucket.
                        you need to delete this manually __prior__ to running the dag.
                        Best would be to combine the two in a shell script

"""
from airflow.hooks.mysql_hook import MySqlHook

from airflow import DAG
from airflow.operators.mysql_operator import MySqlHook
from airflow.operators.python_operator import PythonOperator

from datetime import datetime, timedelta
import logging
import os

default_args = {
    'owner': 'airflow',
    'depends_on_past': False,
    'start_date': datetime(2037, 2, 26),
    'email': ['email@domain.com'],
    'email_on_failure': True,
    'email_on_retry': False,
    'retries': 0,
    'retry_delay': timedelta(minutes=5)
}


def removeSource(**kwargs):
    """Remove the source from the Composer repository. 
    NOTE: in Cloud Composer there is also a GCS bucket that is shadowed here. You must remove the file
    there first."""
    context = kwargs
    if not context:
        logging.error("No context provided")
        return

    dag_run = context['dag_run']
    if not dag_run:
        logging.error("No dagrun")
        return

    dag_id = dag_run.conf["parameter"]
    if not dag_id:
        logging.error("No dag_id parameter supplied")
        return

    hook=MySqlHook( mysql_conn_id= "airflow_db")
    sql="select fileloc from dag where dag_id='{}'".format( dag_id)
    logging.info("Running sql {}".format(sql))
    row = hook.get_first(sql)
     if not row:
        logging.warn("No entry found for source file. Make sure you specified the dag name properly.")
        return None
 
    logging.info('row:{}'.format(str(row)))
    fileloc = row[0]
    if not fileloc:
        logging.warn('python no file location for dag "{}" found in DB!'.format(fileloc))
    if fileloc and os.path.exists(fileloc):
        logging.info('removing "{}"'.format(fileloc))
        os.remove(fileloc)
    else:
        logging.warn('python file for dag "{}" not found!'.format(fileloc))
    return fileloc


def cleanDag(**kwargs):
    """clean the dag db of all entries for specific DAG"""
    context = kwargs
    if not context:
        logging.error("No context provided")
        return

    dag_run = context['dag_run']
    if not dag_run:
        logging.error("No dagrun")
        return

    dag_id = dag_run.conf["parameter"]
    if not dag_id:
        logging.error("No dag_id parameter supplied")
        return


    hook=MySqlHook( mysql_conn_id= "airflow_db")

    for t in ["xcom", "task_instance", "sla_miss", "log", "job", "dag_run", "dag" ]:
        sql="delete from {} where dag_id='{}'".format(t, dag_id)
        hook.run(sql, True)
        pass


with DAG('remove_dag', default_args=default_args) as dag:

    cleanDB = PythonOperator(
        task_id='cleanMetaData',
        python_callable=cleanDag,
        provide_context=True,
        dag=dag)




    removeDagSource =  PythonOperator(
        task_id='removeSource',
        python_callable=removeSource,
        provide_context=True,
        dag=dag)


    removeDagSource >> cleanDB