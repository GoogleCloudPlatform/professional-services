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
        echo "Validating $FOLDER - Checking python files"

        FILES_TO_CHECK=$(find $FOLDER -type f -name "*.py")

        # Initialize FILES_TO_LINT to empty string
        FILES_TO_LINT=""

        if [[ ! -z "$FILES_TO_CHECK" ]]
        then
            # Checking python files
            # python 2 yapf
            echo "Testing formatting for python2 files in $FOLDER"
            # Getting the list of files to lint
            # this returns empty if there is a syntax error (for python3 files for instance)
            FILES_TO_LINT+=$(python2 /usr/local/bin/yapf --diff -r --style google $FILES_TO_CHECK 2>&1 | egrep '^---.*\(original\)$' | awk '{print $2}')

            if [[ ! -z "$FILES_TO_LINT" ]]
            then
                echo "Some files need to be formatted in $FOLDER - FAIL"
                echo "$FILES_TO_LINT"
                exit 1
            fi

            # Checking python files
            # python 3 yapf
            echo "Testing formatting for python3 files in $FOLDER"
            FILES_TO_LINT+=$(python3 /usr/local/bin/yapf --diff -r --style google $FILES_TO_CHECK | egrep '^---.*\(original\)$' | awk '{print $2}')

            if [[ ! -z "$FILES_TO_LINT" ]]
            then
                echo "Some files need to be formatted in $FOLDER - FAIL"
                echo "$FILES_TO_LINT"
                exit 1
            fi

            if [[ -z "$FILES_TO_LINT" ]]
            then
                echo "No files need to be formatted in $FOLDER - PASS"
            fi
        else
            echo "No python files found for $FOLDER - PASS"
        fi
    fi
done
