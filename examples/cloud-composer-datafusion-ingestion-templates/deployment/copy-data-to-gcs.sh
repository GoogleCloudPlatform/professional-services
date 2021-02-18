#!/bin/bash
# Copyright 2021 Google LLC
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

echo "The current working directory: $PWD"
#cd sample-data
#echo "The current working directory: $PWD"
for file in $(ls -R sample-data | awk '/:$/&&f{s=$0;f=0}/:$/&&!f{sub(/:$/,"");s=$0;f=1;next}NF&&f{ print s"/"$0 }')
do
echo "File is ${file}"
dest="$(dirname "$file")"
dest=$(echo $dest | sed 's|sample-data||')
echo "dest=$dest"
gsutil cp ${file} gs://${DATA_BUCKET}$dest/
done