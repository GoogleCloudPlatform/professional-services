#!/bin/sh

# Copyright 2022 Google LLC

# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at

#    https://www.apache.org/licenses/LICENSE-2.0

# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.
#

#**
# @brief    Displays usage details.
#
usage() {
    echo "$*\n usage: $(basename "$0")" \
        "-o <org_id> -f <format>\n" \
        "example: $(basename "$0") -o 1234567890 \n" \
        "Parameters:\n" \
        "-o --org       : GCP Organization Id (mandatory parameter).\n" \
        "-f --format    : Result format (optional parameter; defaults to csv and support json).\n" \
    exit 1
}

### Start of mainline code ###

PARAMETERS=()
while [[ $# -gt 0 ]]
do
    param="$1"

    case $param in
        -o|--org)
        ORG="$2"
        shift
        shift
        ;;
        -f|--format)
        FORMAT="$2"
        shift
        shift
        ;;
    esac
done

set -- "${PARAMETERS[@]}"

if [[ -z $ORG ]]; then
    usage "org id is a mandatory parameter"
    exit 1
fi

if [[ -z $FORMAT ]]; then
  #set the default format as csv
  FORMAT="csv"
  echo "Using default format " $FORMAT
fi

java -jar target/custom-roles-analyzer-1.0-SNAPSHOT.jar -o $ORG -f $FORMAT

