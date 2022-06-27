# Webhook example

This module is a webhook example for Dialogflow. An agent created in Dialogflow is connected to this webhook that is running in Cloud Function.
The webhook also connects to a Cloud Firestore to get the users information used in the example.

## Recommended Reading
[Dialogflow Fulfillment Overview](https://cloud.google.com/dialogflow/docs/fulfillment-overview).

## Technology Stack
1. Cloud Firestore
1. Cloud Functions
1. Dialogflow

## Libraries
1. Pandas
1. Google Cloud Firestore
1. Dialogflow

## Programming Language
Python 3

## Project Structure

```
.
└── dialogflow_webhook_bank_example
 ├── main.py # Implementation of the webhook
 ├── intents_config.yaml # Configuration of the intent from dialogflow
 ├── agent.zip # Configuration of the agent for this example in dialogflow
 ├── requirements.txt # Required libraries for this example
```

## Setup Instructions
### Project Setup
How to setup your project for this example can be found [here](https://cloud.google.com/dialogflow/docs/quick/setup).

### Dialogflow Agent Setup

1. Build an agent by following the instructions [here](https://cloud.google.com/dialogflow/docs/quick/build-agent).
1. Once the agent is built, go to settings ⚙ and under the Export and Import tab, choose the option RESTORE FROM ZIP.
1. Follow the instructions to restore the agent from agent.zip.


### Cloud Functions Setup
This implementation is deployed on GCP using Cloud Functions.
More info [here](https://cloud.google.com/functions/docs/concepts/overview).

To run the Python scripts on GCP, the `gcloud` command-line tool from the Google Cloud SDK is needed.
Refer to the [installation](https://cloud.google.com/sdk/install) page for the appropriate
instructions depending on your platform.

Note that this project has been tested on a Unix-based environment.

After installing, make sure to initialize your Cloud project:

`$ gcloud init`

### Cloud Firestore Setup
Quick start for Cloud Firestore can be found [here](https://cloud.google.com/firestore/docs/quickstart-servers).

#### How to add data
This example connects to a Cloud Firestore with a collection with the following specification:

    Root collection
     users =>
         document_id
             NXJn5wTqWXwiTuc5tdun => {
                 'first_name': 'Pedro',
                 'last_name': 'Perez',
                 'accounts': {
                     'saving': {
                         'transactions': [
                             {'type': 'deposit', 'amount': 20},
                             {'type': 'deposit', 'amount': 90}
                          ],
                         'balance': 110},
                     'checking': {
                         'transactions': [
                             {'type': 'deposit', 'amount': 50},
                             {'type': 'withdraw', 'amount': '-10'}
                         ],
                         'balance': 150}
                 },
                 'user_id': 123456
             }

Examples how to add data to a collection can be found [here](https://cloud.google.com/firestore/docs/quickstart-servers#add_data).

    from google.cloud import firestore

    user_dict= {
      u'user_id': u'123456',
      u'first_name': u'Pedro',
      u'last_name': u'Perez',
      u'accounts': {
          u'checking': {
            u'transactions': [
                {u'amount': 50, 'type': 'udeposit'},
                {u'type': u'withdraw', u'amount': u'-10'}
              ],
              u'balance': 150
           },
           u'saving': {
              u'transactions': [
                  {u'amount': 20, u'type': u'deposit'},
                  {u'type': u'deposit', u'amount': 90}
               ],
               u'balance': 110
            }
        }
    }
    db = firestore.Client()
    db.collection(u'users').document(user_dict['user_id']).set(user_dict)

## Deployment

   $ gcloud functions deploy dialogflow_webhook_bank
         --runtime python37
         --trigger-http
         --allow-unauthenticated

## Usage
### Dialogflow Agent Example

      [User] Hi, Hello, I need assistance
      [Agent] Welcome to our bank! Can I have your user id?
      [User] <Give an invalid user_id number> user_id 12345
      ↳ [Agent] Sorry I could not find your user_id. Can you try again?
      [User] <Give a valid user_id number> user id 123456
      ↳ [Agent] What can I do for you?
      ↳ [User] Check my balance, Verify my balance, balance
           ↳ [Agent] Here are your account balances.
                <List of all account balances from firebase>
                [Agent]What else can I do for you? - Follow up
      ↳ [User] All my transactions, transactions,
           ↳ [Agent] Here are all the transactions that I found.
                <List of all the transactions from firebase>
                [Agent] What else can I do for you? - Follow up
      ↳ [User] Deposit transactions, credits, deposits,
           ↳ [Agent] Here are all the deposit transactions that I found.
               <List of deposit transactions in firebase>
               [Agent] What else can I do for you? - Follow up
      ↳[User] I am done, thanks, bye
          ↳ [Agent] Have a nice day!

### Running the sample from Dialogflow console

In [Dialogflow's console](https://console.dialogflow.com), in the simulator on the right, query your Dialogflow agent with `I need assistance` and respond to the questions your Dialogflow agent asks.

### Running the sample using gcloud util

  Example:

    $ gcloud functions call dialogflow_webhook_bank --data
        '{
          "responseId": "ec0be141-e09a-4dca-b445-4e811ad4999b-ab1309b0",
          "queryResult": {
            "queryText": "123456 user id",
            "action": "welcome.welcome-custom",
            "parameters": {
              "user_id": 123456
            },
            "allRequiredParamsPresent": true,
            "fulfillmentText": "What can I do for you?",
            "fulfillmentMessages": [
              {
                "text": {
                  "text": [
                    "What can I do for you?"
                  ]
                }
              }
            ],
            "outputContexts": [
              {
                "name": "projects/<project-id>/agent/sessions/e7f62474-fd2c-3ca0-dfa6-73d3ed2ab17f/contexts/user_id_action-followup",
                "lifespanCount": 5,
                "parameters": {
                  "user_id": 123456,
                  "user_id.original": "123456"
                }
              },
              {
                "name": "projects/<project-id>/agent/sessions/e7f62474-fd2c-3ca0-dfa6-73d3ed2ab17f/contexts/welcome-followup",
                "lifespanCount": 1,
                "parameters": {
                  "user_id": 123456,
                  "user_id.original": "123456"
                }
              },
              {
                "name": "projects/<project-id>/agent/sessions/e7f62474-fd2c-3ca0-dfa6-73d3ed2ab17f/contexts/__system_counters__",
                "parameters": {
                  "no-input": 0,
                  "no-match": 0,
                  "user_id": 1234567891,
                  "user_id.original": "123456"
                }
              }
            ],
            "intent": {
              "name": "projects/<project-id>/agent/intents/e3cabac7-cfb8-4da1-96bb-f14687913bf6",
              "displayName": "user_id_action"
            },
            "intentDetectionConfidence": 0.78590345,
            "languageCode": "en"
          },
          "originalDetectIntentRequest": {
            "payload": {}
          },
          "session": "projects/<project-id>/agent/sessions/e7f62474-fd2c-3ca0-dfa6-73d3ed2ab17f"
        }


# References
[google-cloud-firestore.Documents API](https://googleapis.dev/python/firestore/latest/document.html#google.cloud.firestore_v1.document)

[google-cloud-firestore.Queries API](https://googleapis.dev/python/firestore/latest/query.html#google.cloud.firestore_v1.query)

[Example querying and filtering data from Cloud Firestore](https://cloud.google.com/firestore/docs/query-data/queries)

[Pandas Dataframe Libraries](https://pandas.pydata.org/pandas-docs/stable/reference/api/pandas.DataFrame.html)