#! /usr/bin/bash
# Copyright 2022 Google LLC
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

# Dataproc cluster custom image script

apt-get update -y
apt-get install wget -y
apt-get install zstd -y
apt-get install python3-pip -y

pip3 install --upgrade textblob zstandard better_profanity textstat google-cloud-storage

python3 -m textblob.download_corpora