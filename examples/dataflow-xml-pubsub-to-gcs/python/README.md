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

## 1.a. Create a new Google Cloud project

**It is recommended to go through this walkthrough using a new temporary Google
Cloud project, unrelated to any of your existing Google Cloud projects.**

See https://cloud.google.com/resource-manager/docs/creating-managing-projects
for more details.

## 1.a. Configure default project

To simplify the following commands, set the default GCP project.

```
PROJECT=<CHANGE ME>
gcloud config set project $PROJECT
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

# Configure the cloud environment
## Configure a PubSub topic
pub_sub_to_xml

## Run the test
### Start sending messages to PubSub
```
python publish2PubSub.py \
--project_id PROJECT-ID \
--pub_sub_topic_id TOPIC-ID \
--xml_string XML_STRING \
--message_send_interval MESSAGE_SEND_INTERVAL
```
For example:
```
python publish2PubSub.py \
--project_id my-test-project \
--pub_sub_topic_id xml_messages \
--xml_string "<note><to>PubSub</to><from>Test</from><heading>Test</heading><body>Sample body</body></note>" \
--message_send_interval 1
```

### Execute the Pipeline
Open up a new terminal and ...
```
python beamPubSubXml2Gcs.py \
--project_id PROJECT-ID \
--input_topic_id TOPIC-ID \
--runner RUNNER \
--window_size WINDOW_SIZE \
--output_path OUTPUT_PATH \
--num_shards NUM_SHARDS
```
For example:
```
python beamPubSubXml2Gcs.py \
--project_id my-test-project \
--input_topic_id xml_messages \
--runner DataflowRunner \
--window_size 1.0 \
--gcs_path "gs://test-pubsub-xml-bucket/" \
--num_shards 2
```

## 5. Monitor the Dataflow Job

Navigate to https://console.cloud.google.com/dataflow/jobs to locate the job
you just created.  Clicking on the job will let you navigate to the job
monitoring screen.

### Debug the Pipeline
This sample contains the necessary bidings to debug this code in Vs Code. To do so, please install the VsCode Google Cloud [extension](https://cloud.google.com/code/docs/vscode/install)

### Terminate the PubSub streaming
On the terminal where you ran the _publish2PubSub_ script, press _Ctrl+C_ and _Y_ to confirm.