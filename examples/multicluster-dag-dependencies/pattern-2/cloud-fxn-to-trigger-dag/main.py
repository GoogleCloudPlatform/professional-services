# Copyright 2022 Google Inc.
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
"""
Trigger a DAG in a Cloud Composer 2 environment in response to an event,
using Cloud Functions.
"""

import airflow_rest_api
import dag_dependency
import logging


def trigger_dag_gcf(data, context=None):  #event_data, context)
    """
    Trigger a DAG and pass event data.
    
    Args:
      data: A dictionary containing the data for the event. Its format depends
      on the event.
      context: The context object for the event.
    
    For more information about the arguments, see:
    https://cloud.google.com/functions/docs/writing/background#function_parameters
    """

    attributes_dict = {}
    logging.info('data: %s', data)

    if "attributes" in data and data["attributes"]:
        attributes_dict = data["attributes"]
        if "workflow_id" in attributes_dict and attributes_dict["workflow_id"]:
            logging.info('attributes_dict: %s', attributes_dict)
    else:
        logging.error('dependency exeption (attributes required)')

    dict_result, composer_urls = dag_dependency.get_dag_dependency(
        attributes_dict)

    for dependency in dict_result:
        web_server_url = composer_urls[dependency['environment_name']]['url']
        dag_id = dependency['dag_id']
        logging.info('dependent dag data: %s, %s', web_server_url, dag_id)
        airflow_rest_api.trigger_dag(web_server_url, dag_id, data)
