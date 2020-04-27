#!/bin/bash -eu
#
# Copyright 2019 Google LLC
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

sudo apt-get update
sudo apt-get install openjdk-8-jdk git maven -y
sudo apt-get install google-cloud-sdk-cbt -y
sudo apt-get --only-upgrade install kubectl google-cloud-sdk=271.0.0-0 google-cloud-sdk-app-engine-grpc google-cloud-sdk-app-engine-go google-cloud-sdk-cloud-build-local google-cloud-sdk-datastore-emulator google-cloud-sdk-app-engine-python google-cloud-sdk-cbt=271.0.0-0 google-cloud-sdk-bigtable-emulator google-cloud-sdk-app-engine-python-extras google-cloud-sdk-datalab google-cloud-sdk-app-engine-java -y
curl https://bootstrap.pypa.io/get-pip.py -o get-pip.py
sudo python3 get-pip.py
sudo pip3 install virtualenv
virtualenv -p python3 venv
source venv/bin/activate
sudo apt -y --allow-downgrades install openjdk-8-jdk git maven google-cloud-sdk=271.0.0-0 google-cloud-sdk-cbt=271.0.0-0
cd ~
git clone https://github.com/galic1987/professional-services
cd professional-services/examples/cryptorealtime/
gsutil cp README.md ${bucket_name}${bucket_folder}
mvn clean install
echo "export PROJECT_ID=${project_id}" >> ~/.bashrc
echo "export REGION=${region}" >> ~/.bashrc
echo "export ZONE=${zone}" >> ~/.bashrc
echo "export BUCKET_NAME=gs://${bucket_name}" >> ~/.bashrc
echo "export BUCKET_FOLDER=${bucket_folder}" >> ~/.bashrc
echo "export BIGTABLE_INSTANCE_NAME=${bigtable_instance_name}" >> ~/.bashrc
echo "export BIGTABLE_TABLE_NAME=${bigtable_table_name}" >> ~/.bashrc
echo "export BIGTABLE_FAMILY_NAME=${bigtable_family_name}" >> ~/.bashrc
cbt -instance=$BIGTABLE_INSTANCE_NAME createtable $BIGTABLE_TABLE_NAME families=$BIGTABLE_FAMILY_NAME
cd frontend
pip install -r requirements.txt --user
python app.py $PROJECT_ID $BIGTABLE_INSTANCE_NAME $BIGTABLE_TABLE_NAME $BIGTABLE_FAMILY_NAME
