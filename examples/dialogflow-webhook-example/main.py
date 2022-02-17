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
"""Webhook example.

    This module is a webhook example for Dialogflow. An agent created in
    Dialogflow is connected to this webhook that is running in Cloud Function.
    The webhook also connects to a Cloud Firestore to get the users information
    used in the example.
"""
import json
import logging
import os.path
from typing import Dict

import flask
import pandas as pd
from pandas.io.json import json_normalize
import yaml

from google.cloud import firestore


def dialogflow_webhook_bank(request: flask.Request):
    r"""HTTP Cloud Function that implement a webhook for Dialogflow.


  Args:
      request (flask.Request): The request object.
      <http://flask.pocoo.org/docs/1.0/api/#flask.Request>
      Example for all transactions request from the user:  {
          "responseId": "52e58648-6a44-47e5-aa1f-89885fbf960a-35305a77",
          "queryResult": {
            "queryText": "transactions",
            "parameters": {},
            "allRequiredParamsPresent": true,
            "fulfillmentMessages": [ {
                "text": {
                  "text": [ "" ] } } ],
            "outputContexts": [ {
                "name":
                  "projects/<project-id>/agent/sessions/55b18fa2-d3fb-3eb6-f4a6-8f3362106db5/contexts/user_id_action-followup",
                "lifespanCount": 5,
                "parameters": {
                  "user_id": 1234567891,
                  "user_id.original": "1234567891" } }, {
                "name":
                  "projects/<project-id>/agent/sessions/55b18fa2-d3fb-3eb6-f4a6-8f3362106db5/contexts/account_transactions-followup",
                "lifespanCount": 5 }, {
                "name":
                  "projects/<project-id>/agent/sessions/55b18fa2-d3fb-3eb6-f4a6-8f3362106db5/contexts/__system_counters__",
                "parameters": {
                  "no-input": 0,
                  "no-match": 0 } } ],
            "intent": {
              "name":
                "projects/<project-id>/agent/intents/245e05dc-cdfa-47a7-ac6a-7e7f8c88111e",
              "displayName": "account_transactions" },
            "intentDetectionConfidence": 1,
            "languageCode": "en" },
          "originalDetectIntentRequest": {
            "payload": {} },
          "session":
            "projects/<project-id>/agent/sessions/55b18fa2-d3fb-3eb6-f4a6-8f3362106db5"
            }

  Returns:
    json response with fulfillment.
    Example:
      { "fulfillmentText":
          "From webhook:
              Welcome to our bank! Can I have your social security number?"
      }

    Example of the raw API:
      {
        "responseId": "5169a48e-ee88-4dac-b703-8ae0f2574049-35305a77",
        "queryResult": {
          "queryText": "hi",
          "action": "input.welcome",
          "parameters": {},
          "allRequiredParamsPresent": true,
          "fulfillmentText":
              "From webhook: Welcome to our bank!
                  Can I have your social security number?",
          "fulfillmentMessages": [
            {
              "text": {
                "text": [
                  "From webhook:
                      Welcome to our bank!
                      Can I have your social security number?"
                ]
              }
            }
          ],
          "outputContexts": [
            {
              "name": "projects/<project-id>/agent/sessions/ \
                  55b18fa2-d3fb-3eb6-f4a6-8f3362106db5/contexts/ \
                  welcome-followup",
              "lifespanCount": 2
            }
          ],
          "intent": {
            "name": "projects/<project-id>/agent/intents/ \
                d81c88bf-8f56-41e8-8e2c-a6fb485bd981",
            "displayName": "welcome"
          },
          "intentDetectionConfidence": 1,
          "diagnosticInfo": {
            "webhook_latency_ms": 141
          },
          "languageCode": "en"
        },
        "webhookStatus": {
          "message": "Webhook execution successful"
        }
    }
  """

    request_json = request.get_json(silent=True)

    # Load the intents from the intents_config.yaml configuration file.
    intents = Intents()
    intents_handlers = intents.load_config()

    if request_json:
        flattener = Flattener(request=request_json)

        # Get the intent display name configure in dialogflow.
        intent_name = flattener.get_intent_name()

        # Get the name of handler for the intent.
        handler_name = intents.get_intent_handler(intent_name, intents_handlers)

        # Run the handler.
        handlers = globals()['Handlers']()
        return getattr(handlers, handler_name)(flattener=flattener)


def get_firestore_client():
    """Gets the firestore users collection."""
    return firestore.Client()


class Flattener:
    """Flattener for the Dialogflow request.

  Normalize the dataflow json request to pandas dataframe.
  https://pandas.pydata.org/pandas-docs/stable/reference/api/pandas.DataFrame.html
  """

    def __init__(self, **kwargs):
        self.request = kwargs['request']

    def transform(self):
        return json_normalize(self.request)

    def get_intent_name(self):
        return json_normalize(
            self.request['queryResult']['intent'])['displayName'][0]

    def get_session(self):
        return json_normalize(self.request).session[0]

    def get_parameters(self):
        return json_normalize(self.request['queryResult']['parameters'])

    def get_context(self):
        return json_normalize(self.request['queryResult']['outputContexts'])


class Messages:
    """Returns follow up messages in case of an error."""

    def user_id_not_found(self, user_id):
        return json.dumps({
            'fulfillmentText':
                f"From webhook: Sorry I could find your user_id, {user_id}."
                f"Can you try again?"
        })


class Handlers:
    """Returns handlers for each intents define in the config yaml file."""

    def welcome_handler(self, **kwargs):
        return json.dumps({
            'fulfillmentText': 'From webhook: Welcome to our bank! '
                               'Can I have your user id number?'
        })

    def goodbye_handler(self, **kwargs):
        return json.dumps({'fulfillmentText': 'From webhook: Have a nice day!'})

    def user_id_action_handler(self, **kwargs):
        return json.dumps(
            {'fulfillmentText': 'From webhook: What can I do for you'})

    def account_balance_handler(self, **kwargs):
        """Return the account balance."""
        flattener = kwargs['flattener']
        messages = Messages()

        user_id = self._get_user_id(flattener)

        # Get firestore client and extract the user data base on user_id provided.
        db = get_firestore_client()
        client_ref = db.collection(u'users').where(u'user_id', u'==', user_id)

        users = client_ref.stream()
        for user in users:
            """Example:
            user_dict: {
               'user_id': 123456,
               'first_name': 'Pedro',
               'last_name': 'Perez',
               'accounts': {
                  'checking': {
                     'transactions': [
                         {'amount': 50, 'type': 'deposit'},
                         {'type': 'withdraw', 'amount': '-10'}
                       ],
                      'balance': 150
                    },
                  'saving': {
                      'transactions': [
                          {'amount': 20, 'type': 'deposit'},
                          {'type': 'deposit', 'amount': 90}
                        ],
                      'balance': 110
                    }
                }
             }
        """
            user_dict = user.to_dict()
            return json.dumps({
                'fulfillmentText':
                    f"From webhook: Here are your account balances."
                    f"Checking account is {user_dict['accounts']['checking']['balance']}. "
                    f"Saving account is {user_dict['accounts']['saving']['balance']}. "
                    f"What else can I do for you?"
            })

        return messages.user_id_not_found(user_id)

    def account_transactions_handler(self, **kwargs):
        """Returns all the transactions (deposits and withdraws)."""
        flattener = kwargs['flattener']
        messages = Messages()

        # Get the user_id from the context in the request.
        user_id = self._get_user_id(flattener)

        # Get the firestore client and extract the user data base on user_id
        # provided.
        db = get_firestore_client()
        client_ref = db.collection(u'users').where(u'user_id', u'==', user_id)
        users = client_ref.stream()
        for user in users:
            """Example:
            user_dict: {
               'user_id': 123456,
               'first_name': 'Pedro',
               'last_name': 'Perez',
               'accounts': {
                   'checking': {
                     'transactions': [
                         {'amount': 50, 'type': 'deposit'},
                         {'type': 'withdraw', 'amount': '-10'}
                       ],
                       'balance': 150
                    },
                    'saving': {
                       'transactions': [
                           {'amount': 20, 'type': 'deposit'},
                           {'type': 'deposit', 'amount': 90}
                        ],
                        'balance': 110
                     }
                 }
             }
        """
            user_dict = user.to_dict()
            message = 'From webhook: Here are all the transactions that I found:\n'
            all_transactions = ','.join([
                f"({transaction['type']}, {transaction['amount']})"
                for transaction in
                user_dict['accounts']['checking']['transactions'] +
                user_dict['accounts']['saving']['transactions']
            ])
            return json.dumps({
                'fulfillmentText':
                    ' '.join([
                        message, all_transactions, 'What else can I do for you?'
                    ])
            })
        return messages.user_id_not_found(user_id)

    def transactions_by_type_handler(self, **kwargs):
        """Returns all the transaction by type (deposit or withdraw)."""
        flattener = kwargs['flattener']
        messages = Messages()

        # Get the user_id from the context in the request.
        user_id = self._get_user_id(flattener)

        # Get the firestore client and extract the user data base on user_id
        # provided.
        db = get_firestore_client()
        client_ref = db.collection(u'users').where(u'user_id', u'==', user_id)
        users = client_ref.stream()
        for user in users:
            """Example:
         user_dict: {
           'user_id': 123456,
           'first_name': 'Pedro',
           'last_name': 'Perez',
           'accounts': {
              'checking': {
                 'transactions': [
                     {'amount': 50, 'type': 'deposit'},
                     {'type': 'withdraw', 'amount': '-10'}
                   ],
                   'balance': 150
                },
                'saving': {
                   'transactions': [
                       {'amount': 20, 'type': 'deposit'},
                       {'type': 'deposit', 'amount': 90}
                    ],
                    'balance': 110
                 }
             }
         }
        """
            user_dict = user.to_dict()
            logging.info('user_dict: %s', user_dict)

            # Get all the transactions in the checking account.
            df_checking_transactions = json_normalize(
                user_dict['accounts']['checking']['transactions'])

            # Get all the transactions in the saving account.
            df_saving_transactions = json_normalize(
                user_dict['accounts']['saving']['transactions'])

            # Concatenate all the transactions in one dataframe
            df_all_transactions = pd.concat(
                [df_checking_transactions, df_saving_transactions])

            message = 'From webhook: Here are all the transactions that I found:\n'
            parameters = flattener.get_parameters()
            transaction_type = parameters['transaction_type'][0]

            # Extract the type of transactions that the user ask: deposit or withdraw.
            results = df_all_transactions.loc[df_all_transactions.type ==
                                              transaction_type]

            # Build the message.
            for row in results.head().itertuples():
                message = f"{message}, {row.type}, {row.amount})"
<<<<<<< HEAD
=======

>>>>>>> upstream/main
            return json.dumps({
                'fulfillmentText':
                    ' '.join([message, 'What else can I do for you?'])
            })
        return messages.user_id_not_found(user_id)

    def _get_user_id(self, flattener: Flattener):
        context_full_name = os.path.join(flattener.get_session(), 'contexts',
                                         'user_id_action-followup')
        parameter_full_name = '.'.join(['parameters', 'user_id'])
        output_context_df = flattener.get_context()
        user_id = output_context_df.loc[output_context_df.name ==
                                        context_full_name,
                                        parameter_full_name].to_list()[0]
        return user_id


class Intents:
    """Defines Dialogflow intents.

  More info: https://cloud.google.com/dialogflow/docs/intents-overview
  """

    def load_config(self):
        """Returns a dict with all the intents.

    Example: {
               'intents': {
                  'welcome': 'welcome_handler',
                  'fallback': 'fallback_handler',
                  'user_id_action': 'user_id_action_handler',
                  'account_balance': 'account_balance_handler',
                  'account_transactions': 'account_transactions_handler',
                  'credits': 'transactions_by_type_handler',
                  'withdraws': 'transactions_by_type_handler',
                  'goodbye': 'goodbye_handler'
                }
              }
    """

        config_file = 'intents_config.yaml'
        with open(config_file, 'r') as config:
            return yaml.load(config, Loader=yaml.Loader)

    def get_intent_handler(self, intent_display_name: str,
                           intent_handlers: Dict[str, str]):
        r"""Returns the name of the intent handlers.

    Args:
         intent_display_name: The name of the intent from the request. \
         For example: ...
            "intent": {
              "name":
                "projects/<project-id>/agent/intents/f45f3888-89bb-48d4-a50a-7b3fc8486a1b",
              "displayName": "account_balance" }, ...
         intent_handlers: Dict of intents handlers. For example: {
           'intents': {
              'welcome': 'welcome_handler',
              'fallback': 'fallback_handler',
              'user_id_action': 'user_id_action_handler',
              'account_balance': 'account_balance_handler',
              'account_transactions': 'account_transactions_handler',
              'credits': 'transactions_by_type_handler',
              'withdraws': 'transactions_by_type_handler',
              'goodbye': 'goodbye_handler' } }
    """
        return intent_handlers['intents'][intent_display_name]
