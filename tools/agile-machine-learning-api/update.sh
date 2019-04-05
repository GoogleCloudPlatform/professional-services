#!/bin/bash
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


sed -e 's/:[^:\/\/]/="/g;s/$/"/g;s/ *=/=/g' config/config_file.yaml > config.sh

source config.sh

TRAINER_PACKAGE='trainer-0.0.tar.gz'

cd codes/
python setup.py sdist
export GOOGLE_APPLICATION_CREDENTIALS=$service_account_json_key
gsutil cp -r dist/$TRAINER_PACKAGE $bucket_name/$TRAINER_PACKAGE

echo "INFO: Please make sure that train.yaml and config.yaml have same name for trainer file"
