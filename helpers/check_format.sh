#!/bin/bash

# Copyright 2019 Google LLC
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#     https://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.

# This script checks the format of various files in the tools/ subfolders
# based on Google open source style guidelines.
#
# The following languages are currently supported:
# - python (using yapf)

# temporary list of folders to exclude
EXCLUDE_FOLDERS=$(cat helpers/exclusion_list.txt)

for FOLDER in $(find tools examples -maxdepth 1 -mindepth 1 -type d);
do
    if  [[ ! ${EXCLUDE_FOLDERS[@]} =~ "$FOLDER" ]]
    then
        echo "Validating $FOLDER"

        FILES_TO_FORMAT=$(find $FOLDER -type f -name "*.py")

        if [[ ! -z "$FILES_TO_FORMAT" ]]
        then
            # Checking python files
            yapf --diff -r --style google $FILES_TO_FORMAT > /dev/null
            if [[ $? -ne 0 ]]
            then
                echo "Some files need to be formatted by yapf in $FOLDER - FAIL"
                yapf --diff -r --style google $FILES_TO_FORMAT | grep original | awk '{print $2}'
                exit 1
            fi
        else
            echo "No python files found for $FOLDER - PASS"
        fi
    fi
done
