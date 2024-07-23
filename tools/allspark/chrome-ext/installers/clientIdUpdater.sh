#!/bin/bash

# Copyright 2024 Google LLC. All Rights Reserved.
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#    http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.

# Replaces the OAuth Client Id in the configuration of the Chrome extension
# Requirements:
# - sed tool. Installed by default in most linux and mac OS environment

# Check if an email address is provided as an argument
if [ $# -eq 0 ]
then
  echo "Please provide a client id as an argument."
  exit 1
fi

# Store the email address from the argument
CLIENT_ID="$1"

echo "Using client id '$CLIENT_ID' for the Chrome Extension..."
# Linux
sed -i 's/__CLIENT_ID__/'"$CLIENT_ID"'/g' ../manifest.json
# Mac OS
sed -i '' 's/__CLIENT_ID__/'"$CLIENT_ID"'/g' ../manifest.json

echo "Client id updated successfully."