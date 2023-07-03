# Dataflow PubSub XML to Google cloud storage sample pipeline

## License
Copyright 2023 Google LLC

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

    https://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.

# 1. Getting started

## Create a new Google Cloud project

**It is recommended to go through this walkthrough using a new temporary Google
Cloud project, unrelated to any of your existing Google Cloud projects.**

See https://cloud.google.com/resource-manager/docs/creating-managing-projects
for more details. For a quick reference, please follow these steps:

1. Open the [Cloud Platform Console][cloud-console].
2. In the drop-down menu at the top, select **Create a project**.
3. Give your project a name = <CHANGE_ME>
4. Save your project's name to an environment variable for ease of use:
```
export PROJECT=<CHANGE_ME>
```

# 2. Configure a local environment

## Setup the test environment
```
python -m venv dataflow_pub_sub_xml_to_gcs
source ./dataflow_pub_sub_xml_to_gcs/bin/activate
pip install -q --upgrade pip setuptools wheel
pip install 'apache-beam[gcp]' # Linux, Mac
\path\to\env\Scripts\activate # Windows
```
If you're running this on an Apple Silicon Mac and face issues when running, please run the following commands to build the _grpcio_ library from source:
```
pip uninstall grpcio
export GRPC_PYTHON_LDFLAGS=" -framework CoreFoundation"
pip install grpcio --no-binary :all:
```

# 3. Configure the cloud environment

## Setting Google Application Default Credentials

Set your [Google Application Default
Credentials][application-default-credentials] by [initializing the Google Cloud
SDK][cloud-sdk-init] with the command:

```
gcloud init
```
Generate a credentials file by running the
[application-default login](https://cloud.google.com/sdk/gcloud/reference/auth/application-default/login) command:

```
gcloud auth application-default login
```
Make sure to enable necessary APIs:
```
gcloud services enable dataflow.googleapis.com  compute.googleapis.com  logging.googleapis.com  storage-component.googleapis.com  storage-api.googleapis.com  pubsub.googleapis.com  cloudresourcemanager.googleapis.com  cloudscheduler.googleapis.com
```

[cloud-sdk-init]: https://cloud.google.com/sdk/docs/initializing
[application-default-credentials]: https://developers.google.com/identity/protocols/application-default-credentials

## Configure a PubSub topic
### Pubsub Setup
The following [doc](https://cloud.google.com/pubsub/docs/quickstart-console) can be used to set up the topic and optional subscription needed to run this example.

#### Topics
To run this example one topic needs to be created:
1. A topic to publish the XML formatted data
```
export TOPIC_ID=<CHANGE_ME>
gcloud pubsub topics create $TOPIC_ID
```

#### Subscription
**Optionally** You can set up a custom subscription. However, this is not mandatory since the Dataflow PubSub source automatically creates one if a topic is provided.

## Create a GCS bucket

The output will write to a GCS bucket:
```
export BUCKET_NAME=<CHANGE_ME>
gsutil mb gs://$BUCKET_NAME
```

# 4. Run the test
## Start sending messages to PubSub
Execute the message sending script as follows:
```
python publish2PubSub.py \
--project_id $PROJECT \
--pub_sub_topic_id $TOPIC_ID \
--xml_string XML_STRING \
--message_send_interval MESSAGE_SEND_INTERVAL
```
For example:
```
python publish2PubSub.py \
--project_id $PROJECT \
--pub_sub_topic_id $TOPIC_ID \
--xml_string "<note><to>PubSub</to><from>Test</from><heading>Test</heading><body>Sample body</body></note>" \
--message_send_interval 1
```

## Start the Pipeline
Open up a new terminal and execute the following command:
```
python beamPubSubXml2Gcs.py \
--project_id $PROJECT \
--input_topic_id $TOPIC_ID \
--runner RUNNER \
--window_size WINDOW_SIZE \
--output_path "gs://$BUCKET_NAME/" \
--num_shards NUM_SHARDS
```
For example:
```
python beamPubSubXml2Gcs.py \
--project_id $PROJECT \
--input_topic_id $TOPIC_ID \
--runner DataflowRunner \
--window_size 1.0 \
--gcs_path gs://$BUCKET_NAME/ \
--num_shards 2
```

## Monitor the Dataflow Job
Navigate to https://console.cloud.google.com/dataflow/jobs to locate the job
you just created.  Clicking on the job will let you navigate to the job
monitoring screen.

## Debug the Pipeline
**Optionally** This sample contains the necessary bindings to debug step by step and/or breakpoint this code in Vs Code. To do so, please install the VsCode Google Cloud [extension](https://cloud.google.com/code/docs/vscode/install)

## View the output in CGS

List the generated files in the GCS bucket and inspect their contents
```
gsutil ls gs://${BUCKET_NAME}/output_location/
gsutil cat gs://${BUCKET_NAME}/output_location/*
```

# 5. Clean up

## Remove cloud resources
1. Delete the PubSub topic
```
gcloud pubsub topics delete $TOPIC_ID
```
2. Delete the GCS files
```
gsutil -m rm -rf "gs://${BUCKET_NAME}/output_location/*"
```
3. Remove the GCS bucket
```
gsutil rb gs://${BUCKET_NAME}
```
4. **Optionally** Revoke the authentication credentials that you created, and delete the local credential file.
```
gcloud auth application-default revoke
```
5. **Optionally** Revoke credentials from the gcloud CLI.
```
gcloud auth revoke
```
## Terminate the PubSub streaming
On the terminal where you ran the _publish2PubSub_ script, press _Ctrl+C_ and _Y_ to confirm.