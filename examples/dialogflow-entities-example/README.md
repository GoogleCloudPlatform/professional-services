# Entities creation and update for Dialogflow
This module is an example how to create and update entities for Dialogflow.

## Recommended Reading
[Entities Options](https://cloud.google.com/dialogflow/docs/entities-options)

## Technology Stack
1. Cloud Storage
1. Cloud Functions
1. Dialogflow

## Programming Language
Python 3

## Project Structure
```
.
└── dialogflow_webhook_bank_example
 ├── main.py # Implementation of examples how to load entities in Dialogflow
 ├── entities.json # file with entities to be load in a json format
 ├── requirements.txt # Required libraries for this example
```
## Setup Instructions
 ### Project Setup
 How to setup your project for this example can be found [here](https://cloud.google.com/dialogflow/docs/quick/setup).

 ### Dialogflow Agent Setup
 Build an agent by following the instructions [here](https://cloud.google.com/dialogflow/docs/quick/build-agent).

 ### Cloud Storage Setup
 Upload the entities.json file to a bucket by following the instructions [here](https://cloud.google.com/storage/docs/quickstart-console#create_a_bucket).

 ### Cloud Functions Setup
 This implementation is deployed on GCP using Cloud Functions.
 More info [here](https://cloud.google.com/functions/docs/concepts/overview).

 To run the Python scripts on GCP, the `gcloud` command-line tool from the Google Cloud SDK is needed.
 Refer to the [installation](https://cloud.google.com/sdk/install) page for the appropriate
 instructions depending on your platform.

 Note that this project has been tested on a Unix-based environment.

 After installing, make sure to initialize your Cloud project:
 ```
 `$ gcloud init`
```

## Usage

### Create entities one by one
Use the EntityTypesClient.create_entity_type to create entities one by one.

#### More Info
[EntityType proto](https://github.com/googleapis/googleapis/blob/551cf1e6e3addcc63740427c4f9b40dedd3dac27/google/cloud/dialogflow/v2/entity_type.proto#L200)

[Client for Dialogflow API - EntityTypeClient.create_entity_type](https://dialogflow-python-client-v2.readthedocs.io/en/latest/_modules/dialogflow_v2/gapic/entity_types_client.html#EntityTypesClient.create_entity_type)

### Example
Run the sample using gcloud util as followed:

```
      $ gcloud functions call entities_builder --data '{
          "entities": [{
             "display_name":
                 "saving-account-types",
             "kind": "KIND_MAP",
             "entities": [{
                 "value": "saving-account-types",
                 "synonyms": [
                     "saving",
                     "saving account",
                     "child saving",
                     "IRA",
                     "CD",
                     "student saving"]
             }]
         }, {
             "display_name":
                 "checking-account-types",
             "kind": "KIND_MAP",
             "entities": [{
                 "value":
                     "checking-account-types",
                 "synonyms": [
                     "checking", "checking account", "student checking account",
                     "student account", "business checking account", "business account"
                 ]
             }]
         }, {
             "display_name": "account_types",
             "kind": "KIND_LIST",
             "entities": [
                 {
                     "value": "@saving-account-types:saving-account-types",
                     "synonyms": [
                         "@saving-account-types:saving-account-types"
                     ]
                 },
                 {
                     "value": "@checking-account-types:checking-account-types",
                     "synonyms": [
                         "@checking-account-types:checking-account-types"
                     ]
                 },
                 {
                     "value": "@sys.date-period:date-period @saving-account-types:saving-account-types",
                     "synonyms": [
                         "@sys.date-period:date-period @saving-account-types:saving-account-types"
                     ]
                 },
                 {
                     "value": "@sys.date-period:date-period @checking-account-types:checking-account-types",
                     "synonyms": [
                         "@sys.date-period:date-period @checking-account-types:checking-account-types"
                     ]
                 }
             ]
         }]
    }'
```

### Create entities in batch
Use the EntityTypesClient.batch_update_entity_types to create or update entities in batch.

#### More Info
[Client for Dialogflow API - EntityTypeClient.batch_update_entity_types](https://dialogflow-python-client-v2.readthedocs.io/en/latest/_modules/dialogflow_v2/gapic/entity_types_client.html#EntityTypesClient.batch_update_entity_types)

[EntityTypeBatch proto](https://github.com/googleapis/googleapis/blob/551cf1e6e3addcc63740427c4f9b40dedd3dac27/google/cloud/dialogflow/v2/entity_type.proto#L533)

[BatchUpdateEntityTypesRequest proto](https://github.com/googleapis/googleapis/blob/master/google/cloud/dialogflow/v2/entity_type.proto#L397)

#### Examples
##### Using entity_type_batch_uri
The URI to a Google Cloud Storage file containing entity types to update or create.
The URI must start with "gs://".
The entities.json file is an example of a json format file that can be uploaded to gcs and passed to the function.
```
    $ gcloud functions call entities_builder --data '{ "bucket": "gs://<bucket_name>/entities.json"}'

```
##### Using entity_type_batch_inline
For each entity type in the batch:
- The `name` is the the unique identifier of the entity type
- If `name` is specified, we update an existing entity type.
- If `name` is not specified, we create a new entity type.
```
   $ gcloud functions call entities_builder --data '{
       "entities_batch": {
           "entity_types":[
               {
                   "name": "5201cee0-ddfb-4f7c-ae94-fff87189d13c",
                   "display_name":
                     "saving-account-types",
                   "kind": "KIND_MAP",
                   "entities": [{
                       "value": "saving-account-types",
                       "synonyms": [
                           "saving",
                           "saving account",
                           "child saving",
                           "IRA",
                           "CD",
                           "student saving",
                           "senior saving"]
                   }]
               },
               {
                   "display_name":
                     "checking-account-types",
                   "kind": "KIND_MAP",
                   "entities": [{
                       "value":
                         "checking-account-types",
                       "synonyms": [
                           "checking", "checking account", "student checking account",
                           "student account", "business checking account", "business account"
                       ]
                   }]
               },
               {
                   "display_name": "account_types",
                   "kind": "KIND_LIST",
                   "entities": [
                       {
                           "value": "@saving-account-types:saving-account-types",
                           "synonyms": [
                               "@saving-account-types:saving-account-types"
                           ]
                       },
                       {
                           "value": "@checking-account-types:checking-account-types",
                           "synonyms": [
                               "@checking-account-types:checking-account-types"
                           ]
                       },
                       {
                           "value": "@sys.date-period:date-period @saving-account-types:saving-account-types",
                           "synonyms": [
                               "@sys.date-period:date-period @saving-account-types:saving-account-types"
                           ]
                       },
                       {
                           "value": "@sys.date-period:date-period @checking-account-types:checking-account-types",
                           "synonyms": [
                               "@sys.date-period:date-period @checking-account-types:checking-account-types"
                           ]
                       }
                   ]
               }
           ]
       }
}'
```

# Entities Definition
```
    └──  main
       ├── creates a map entity
       ├── create a composite entity
       ├── updates a map entity
```

Below the definition of the entities.

## Map entities
#### entity name: saving-accounts-types

Define synonyms: true
```
      {
        "value": "saving-account-types",
        "synonyms": [
          "saving",
          "saving account",
          "child saving",
          "IRA",
          "CD"
        ]
      }
```


#### entity name: checking-account-types

Define synonyms: true
```
      {
        "value": "checking-account-types",
        "synonyms": [
          "checking",
          "checking account",
          "student checking account",
          "student account",
          "business checking account",
          "business account"
        ]
      }
```
## Composite entities
### entity name: account-types
```
      {
        "value": "@saving-account-type:saving-account-type",
        "synonyms": [
          "@saving-account-type:saving-account-type"
        ]
      },

      {
        "value": "@checking-account-type:checking-account-type",
        "synonyms": [
          "@checking-account-type:checking-account-type"
        ]
      },

      {
        "value": "@sys.date-period:date-period @saving-account-type:saving-account-type",
        "synonyms": [
          "@sys.date-period:date-period @saving-account-type:saving-account-type"
        ]
      },

      {
        "value": "@sys.date-period:date-period @checking-account-type:checking-account-type",
        "synonyms": [
          "@sys.date-period:date-period @checking-account-type:checking-account-type"
        ]
      }
```

# References
[Client for Dialogflow API ](https://dialogflow-python-client-v2.readthedocs.io/en/latest/gapic/v2/api.html#dialogflow_v2.EntityTypesClient)

[EntityType proto](https://github.com/googleapis/googleapis/blob/master/google/cloud/dialogflow/v2/entity_type.proto)

[Protocol Buffers Tutorial](https://developers.google.com/protocol-buffers/docs/pythontutorial)