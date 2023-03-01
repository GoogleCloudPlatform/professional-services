### Setup the test environment
```
python -m venv dataflow_pub_sub_xml_to_gcs
source ./dataflow_pub_sub_xml_to_gcs/bin/activate
pip install 'apache-beam[gcp]' # Linux, Mac
\path\to\env\Scripts\activate # Windows
```
If you're running this on an Apple Silicon Mac and face issues when running, please run the following commands to build the _grpcio_ library from source:
```
pip uninstall grpcio
export GRPC_PYTHON_LDFLAGS=" -framework CoreFoundation"
pip install grpcio --no-binary :all:
```

### Configure a PubSub topic
pub_sub_to_xml

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

### Terminate the PubSub streaming
On the terminal where you ran the _publish2PubSub_ script, press _Ctrl+C_ and _Y_ to confirm.