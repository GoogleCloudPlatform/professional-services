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

project_id = "testprojivo" // ***CHANGE THIS***
bucket_name = "cryptorealtime-demo-staging123" // ***CHANGE THIS*** make this unique
credsfile = "/Users/igalic/Downloads/testprojivo-13e8ed7eb6df.json" // ***CHANGE THIS***

// OPTIONAL
region = "us-central1"
zone = "us-central1-a"
bucket_folder = "/temp" // temporary folder
bigtable_instance_name = "cryptorealtime"
bigtable_table_name = "cryptorealtime"
bigtable_family_name = "market" // Note: If you change this you will have to update the RunThePipeline.java file
