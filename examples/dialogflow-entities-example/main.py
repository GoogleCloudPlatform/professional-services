# python3
# ==============================================================================
# Copyright 2020 Google LLC
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
# http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.
# ==============================================================================
"""Cloud function to create and update entities in Dialogflow.

This module is an example how to create and update entities for Dialogflow.
"""

import dialogflow_v2
import flask
import os

from typing import Dict, List


def entities_builder(request: flask.Request):
    """HTTP Cloud Function that create and update entities in Dialogflow.

Args:
    request (flask.Request): The request object. More info:
    <http://flask.pocoo.org/docs/1.0/api/#flask.Request>
"""

    request_json = request.get_json(silent=True)
    arguments = Arguments(**request_json)
    project_id = arguments.project_id
    client = get_dialogflow_client()
    parent = get_agent(client, project_id)

    if request_json and arguments.entities:
        # Create entities one by one.
        create_entities_type(client, arguments.entities, parent)
        return

    elif request_json and arguments.entities_batch:
        # Create in batch using entity_type_batch_inline.
        arguments.pre_process_entities_batch_name()
        client.batch_update_entity_types(
            parent=parent, entity_type_batch_inline=arguments.entities_batch)
        return

    else:
        # Create in batch using entity_type_batch_uri.
        response = client.batch_update_entity_types(
            parent=parent, entity_type_batch_uri=arguments.bucket)

    def callback(operation_future):
        """Returns a callback.

This example uses futures for long-running operations returned from Google Cloud APIs.
These futures are used asynchronously using callbacks and Operation.add_done_callback
More info: https://googleapis.dev/python/google-api-core/1.14.3/futures.html
"""
        operation_future.result()

    response.add_done_callback(callback)


def create_entities_type(client, entities, parent):
    """Creates entities.

Args:
    client: dialogflow_v2.EntityTypesClient
    entities: list of EntityTypes to create
    parent: fully-qualified project_agent string
"""
    for entity_type in entities:
        client.create_entity_type(parent, entity_type)


def get_dialogflow_client():
    """Returns the dialogflow entity types client."""
    return dialogflow_v2.EntityTypesClient()


def get_agent(client: dialogflow_v2.EntityTypesClient, project_id):
    """Returns a fully-qualified project_agent string."""
    return client.project_agent_path(project_id)


class Arguments:
    """Returns the arguments pass to the cloud function or default values.

  Args:
      entities: a list of EntityType
      entities_batch: a dict of EntityTypeBatch
      project_id: id of a project in GCP
      bucket: a URI to a Google Cloud Storage file containing entity types to update or create.
  """

    def __init__(self,
                 entities: List = [],
                 entities_batch: Dict = {},
                 project_id: str = '<project-id>',
                 bucket: str = 'gs://dialog_entities/entities.json'):
        """Initialize the cloud function with the information pass in the call"""
        self.project_id = project_id
        self.entities = entities
        self.entities_batch = entities_batch
        self.bucket = bucket

    def pre_process_entities_batch_name(self):
        """Returns a fully qualify name of the entities name.

  The format is projects/<project-id>/agent/entityTypes/<entity-id>
  """

        for entity in self.entities_batch['entity_types']:
            if all(x in entity for x in ['name']):
                entity['name'] = os.path.join('projects', self.project_id,
                                              'agent/entityTypes',
                                              entity['name'])
