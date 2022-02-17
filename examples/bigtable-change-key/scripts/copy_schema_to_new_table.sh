#!/bin/sh

# Copyright 2020 Google LLC
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#     http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.

usage() {
  echo "Usage $0 INPUT_TABLE_NAME OUTPUT_TABLE_NAME"
  echo
  echo "This will use cbt to create OUTPUT_TABLE_NAME with the same schema as INPUT_TABLE_NAME"
}

if [ "$1" = "-h" ]
then
  usage
  exit 0
fi


if [ $# -lt 2 ]
then
  usage
  exit 1
fi

INPUT_TABLE=$1
OUTPUT_TABLE=$2

echo Creating table "$OUTPUT_TABLE"
cbt createtable "$OUTPUT_TABLE"

cbt ls "$INPUT_TABLE" | tail -n+3 | while read -r line
do
  FAMILY=$( echo "$line" | cut -f 1 )
  echo Adding column family "$FAMILY"
  cbt createfamily "$OUTPUT_TABLE" "$FAMILY"
done
