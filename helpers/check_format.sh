#!/usr/bin/env bash

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
# - golang (using gofmt)
# - typescript (using npm)
# - java (using google-java-format 1.7)

# need_formatting - helper function to error out when
# a folder contains files that need formatting
# @args $1 - Folder local path
# @args $2 - List of files in that folder that need formatting
# Exit with error code 1 - always
need_formatting() {
    FOLDER=$1
    FILES_TO_LINT=${*:2}
    echo "Some files need to be formatted in $FOLDER - FAIL"
    echo "$FILES_TO_LINT"
    exit 1
}

# validate_bash - takes a folder path as input and shell checks files
validate_bash() {
    FOLDER=$1
    echo "Validating $FOLDER - Checking bash files"

    FILES_TO_CHECK=$(find "$FOLDER" -not \( -name node_modules -prune \) -type f -name "*.sh")

    # Initialize FILES_TO_LINT to empty string
    FILES_TO_LINT=""

    if [[ -n "$FILES_TO_CHECK" ]]
    then
        for FILE_TO_CHECK in $FILES_TO_CHECK
        do
            if ! shellcheck -x "$FILE_TO_CHECK";
            then
                FILES_TO_LINT+="$FILE_TO_CHECK "
            fi
        done

	if [[ -n "$FILES_TO_LINT"  ]]
	then
            need_formatting "$FOLDER" "$FILES_TO_LINT"
        fi
    else
        echo "No bash files found for $FOLDER - SKIP"
    fi
}

# validate_python - takes a folder path as input and validate python files
# using yapf (supports both python2 and python3)
# errors out if yapf --diff -r --style google returns a non-0 status
validate_python() {
    FOLDER=$1
    echo "Validating $FOLDER - Checking python files"

    FILES_TO_CHECK=$(find "$FOLDER" -type f -name "*.py")

    # Initialize FILES_TO_LINT to empty string
    FILES_TO_LINT=""


    if ! (cd "$FOLDER" && flake8 --exclude=.git,__pycache__,.venv,venv --select=E9,F,C)
    then
       need_formatting "$FOLDER"
    fi

    if [[ -n "$FILES_TO_CHECK" ]]
    then
        # Checking python files
        # python 2 yapf
        echo "Testing formatting for python2 files in $FOLDER"

        # Getting the list of files to lint
        YAPF_PYTHON2_OUTPUT=$(python2 -m yapf --diff -r --style google "$FILES_TO_CHECK" 2>&1)
        YAPF_PYTHON2_STATUS=$?
        FILES_TO_LINT+=$( echo "$YAPF_PYTHON2_OUTPUT" | grep -E '^---.*\(original\)$' | awk '{print $2}')

        if [[ -n "$FILES_TO_LINT" ]]
        then
            # Error out with details
            need_formatting "$FOLDER" "$FILES_TO_LINT"
        fi

        # Checking python files if python2 failed (i.e not python2 compatible code)
        if [[ "$YAPF_PYTHON2_STATUS" -ne 0 ]]
        then
            # python 3 yapf
            echo "Testing formatting for python3 files in $FOLDER"
            FILES_TO_LINT+=$(
                python3 -m yapf --diff -r --style google "$FILES_TO_CHECK" |
                grep -E '^---.*\(original\)$' |
                awk '{print $2}'
            )

            if [[ -n "$FILES_TO_LINT" ]]
            then
                # Error out with details
                need_formatting "$FOLDER" "$FILES_TO_LINT"
            fi

            if [[ -z "$FILES_TO_LINT" ]]
            then
                echo "No files need to be formatted in $FOLDER - PASS"
            fi
        fi
    else
        echo "No python files found for $FOLDER - SKIP"
    fi
}

# validate_go - takes a folder path as input and validate go files
# using gofmt
# errors out if gofmt returns a non-0 status
validate_go() {
    FOLDER=$1
    echo "Validating $FOLDER - Checking GO files"

    FILES_TO_LINT=$(gofmt -l "$FOLDER")

    if [[ -n "$FILES_TO_LINT" ]]
    then
        # Error out with details
        need_formatting "$FOLDER" "$FILES_TO_LINT"
    else
        echo "No go files need formatting for $FOLDER - SKIP"
    fi
}

# validate_typescript - takes a folder path as input and validate folder
# using gts
# errors out if gts init or npm audit returns a non-0 status
validate_typescript(){
    FOLDER=$1

    FILES_TO_CHECK=$(find "$FOLDER" -type f -name "tsconfig.json")

    if [[ -n "$FILES_TO_CHECK" ]]
    then
        for tsconfig_path in $FILES_TO_CHECK
        do
            tsconfig_dir=$(dirname "$tsconfig_path")
            echo "Validating $tsconfig_dir - Checking typescript files"
            cd "$tsconfig_dir" || exit 1

            if ! npx gts -y init > /dev/null ;
            then
                echo "Running npm audit..."
                if npm audit ;
                then
                    echo "$tsconfig_dir npm audit needs fixing - FAIL"
                    exit 1
                else
                    echo "$tsconfig_dir npm audit is clean - PASS"
                fi
            else
                echo "gts init returned an error - FAIL"
                exit 1
            fi
            cd - || exit 1
        done
    fi
}

# validate_java - takes a folder path as input and validate folder
# using gts
# errors out if gts init or npm audit returns a non-0 status
validate_java(){
    FOLDER=$1
    echo "Validating $FOLDER - Checking java files"

    FILES_TO_CHECK=$(find "$FOLDER" -type f -name "*.java")

    # Initialize FILES_TO_LINT to empty string
    FILES_TO_LINT=""

    if [[ -n "$FILES_TO_CHECK" ]]
    then
        echo "Testing formatting for java files in $FOLDER"

        # shellcheck disable=SC2086
        FILES_TO_LINT=$(
            java -jar "/usr/share/java/google-java-format-1.7-all-deps.jar" \
                --set-exit-if-changed \
                -n $FILES_TO_CHECK
        )

        if [[ -n "$FILES_TO_LINT" ]]
        then
            need_formatting "$FOLDER" "$FILES_TO_LINT"
        fi

        if [[ -z "$FILES_TO_LINT" ]]
        then
            echo "No files need to be formatted in $FOLDER - PASS"
        fi
    else
        echo "No java files found for $FOLDER - SKIP"
    fi
}

# temporary list of folders to exclude
EXCLUDE_FOLDERS=$(cat helpers/exclusion_list.txt)
while IFS= read -r -d '' FOLDER
do
    if  [[ ! ${EXCLUDE_FOLDERS[*]} =~ $FOLDER ]]
    then
        validate_bash "$FOLDER"
        validate_go "$FOLDER"
        validate_java "$FOLDER"
        validate_python "$FOLDER"
        validate_typescript "$FOLDER"
    else
        echo "$FOLDER in exclusion list - SKIP  "
    fi
# Search all directories and sub-directories except sub-directories of .git
# https://stackoverflow.com/a/16595367/101923
done < <(
    find . -maxdepth 2 -mindepth 1 -type d \
        -not \( -path ./.git -prune \) \
        -print0
)
echo "finished checking format"
