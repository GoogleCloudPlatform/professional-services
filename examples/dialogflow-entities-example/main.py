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


def entities_builder(request: flask.Request):
    """HTTP Cloud Function that create and update entities in Dialogflow.

  Args:
      request (flask.Request): The request object. More info:
      <http://flask.pocoo.org/docs/1.0/api/#flask.Request>
  """

    # Example of a list of EntityType.
    # More Info:
    #   https://github.com/googleapis/googleapis/blob/551cf1e6e3addcc63740427c4f9b40dedd3dac27/google/cloud/dialogflow/v2/entity_type.proto#L200
    #   https://dialogflow-python-client-v2.readthedocs.io/en/latest/_modules/dialogflow_v2/gapic/entity_types_client.html#EntityTypesClient.create_entity_type

    entities = [{
        "display_name":
            "saving-account-types",
        "kind":
            dialogflow_v2.entity_types_client.enums.EntityType.Kind.KIND_MAP,
        "entities": [{
            "value":
                "saving-account-types",
            "synonyms": [
                "saving", "saving account", "child saving", "IRA", "CD",
                "student saving"
            ]
        }]
    }, {
        "display_name":
            "checking-account-types",
        "kind":
            dialogflow_v2.entity_types_client.enums.EntityType.Kind.KIND_MAP,
        "entities": [{
            "value":
                "checking-account-types",
            "synonyms": [
                "checking", "checking account", "student checking account",
                "student account", "business checking account",
                "business account"
            ]
        }]
    }, {
        "display_name":
            "account_types",
        "kind":
            dialogflow_v2.entity_types_client.enums.EntityType.Kind.KIND_LIST,
        "entities": [{
            "value": "@saving-account-types:saving-account-types",
            "synonyms": ["@saving-account-types:saving-account-types"]
        }, {
            "value": "@checking-account-types:checking-account-types",
            "synonyms": ["@checking-account-types:checking-account-types"]
        }, {
            "value":
                "@sys.date-period:date-period "
                "@saving-account-types:saving-account-types",
            "synonyms": [
                "@sys.date-period:date-period "
                "@saving-account-types:saving-account-types"
            ]
        }, {
            "value":
                "@sys.date-period:date-period "
                "@checking-account-types:checking-account-types",
            "synonyms": [
                "@sys.date-period:date-period "
                "@checking-account-types:checking-account-types"
            ]
        }]
    }]

    # Example of a EntityTypeBatch dictionary used for entity type batch.
    # More info:
    #   https://github.com/googleapis/googleapis/blob/551cf1e6e3addcc63740427c4f9b40dedd3dac27/google/cloud/dialogflow/v2/entity_type.proto#L533
    # For each entity type in the batch:
    #   If `name` is specified, we update an existing entity type.
    #   If `name` is not specified, we create a new entity type.
    #   The name is the the unique identifier of the entity type.
    # More info:
    #   https://github.com/googleapis/googleapis/blob/master/google/cloud/dialogflow/v2/entity_type.proto#L397
    #   https://dialogflow-python-client-v2.readthedocs.io/en/latest/_modules/dialogflow_v2/gapic/entity_types_client.html#EntityTypesClient.batch_update_entity_types

    entities_batch = {
        "entity_types": [{
            "name":
                "projects/<project_id>/agent/entityTypes/51637fc0-f717-4458-aef1-3d6a51d113f5",
            "display_name":
                "saving-account-types",
            "kind":
                dialogflow_v2.entity_types_client.enums.EntityType.Kind.
                KIND_MAP,
            "entities": [{
                "value":
                    "saving-account-types",
                "synonyms": [
                    "saving", "saving account", "child saving", "IRA", "CD",
                    "student saving"
                ]
            }]
        }, {
            "name":
                "projects/<project_id>/agent/entityTypes/6e4490bc-ec73-468a-be1a-264910421155",
            "display_name":
                "checking-account-types",
            "kind":
                dialogflow_v2.entity_types_client.enums.EntityType.Kind.
                KIND_MAP,
            "entities": [{
                "value":
                    "checking-account-types",
                "synonyms": [
                    "checking", "checking account", "student checking account",
                    "student account", "business checking account",
                    "business account"
                ]
            }]
        }, {
            "display_name":
                "account_types",
            "kind":
                dialogflow_v2.entity_types_client.enums.EntityType.Kind.
                KIND_LIST,
            "entities": [{
                "value": "@saving-account-types:saving-account-types",
                "synonyms": ["@saving-account-types:saving-account-types"]
            }, {
                "value": "@checking-account-types:checking-account-types",
                "synonyms": ["@checking-account-types:checking-account-types"]
            }, {
                "value":
                    "@sys.date-period:date-period "
                    "@saving-account-types:saving-account-types",
                "synonyms": [
                    "@sys.date-period:date-period "
                    "@saving-account-types:saving-account-types"
                ]
            }, {
                "value":
                    "@sys.date-period:date-period "
                    "@checking-account-types:checking-account-types",
                "synonyms": [
                    "@sys.date-period:date-period "
                    "@checking-account-types:checking-account-types"
                ]
            }]
        }]
    }

    client = get_dialogflow_client()
    parent = get_agent(client)

    # Uncomment if you want to create entities one by one.
    # Please refer to README file for details.
    # create_entities_type(client, entities, parent)

    # Uncomment if you want to create in batch using entity_type_batch_inline.
    # Please refer to README file for details.
    # client.batch_update_entity_types(
    #     parent=parent,
    #     entity_type_batch_inline=entities_batch)

    # Example how to create in batch using entity_type_batch_uri.
    # entity_type_batch_uri is the URI to a Google Cloud Storage file containing
    # entity types to update or create.
    entity_type_batch_uri = "gs://<name of the bucket>/entities.json"
    response = client.batch_update_entity_types(
        parent=parent, entity_type_batch_uri=entity_type_batch_uri)

    # This example uses futures for long-running operations returned from
    # Google Cloud APIs.
    # These futures are used asynchronously using callbacks and
    # Operation.add_done_callback
    # More info: https://googleapis.dev/python/google-api-core/1.14.3/futures.html
    def callback(operation_future):
        result = operation_future.result()

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


def get_agent(client: dialogflow_v2.EntityTypesClient):
    """Returns a fully-qualified project_agent string."""

    return client.project_agent_path("<project_id>")
