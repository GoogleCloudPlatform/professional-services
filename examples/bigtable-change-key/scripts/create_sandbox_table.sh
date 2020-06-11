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
  echo "Usage $0 TABLE_NAME"
  echo
  echo "This will use cbt to create a sandbox table of name TABLE_NAME"
}

if [ "$1" = "-h" ]
then
  usage
  exit 0
fi


if [ $# -lt 1 ]
then
  usage
  exit 1
fi


# Create table
TABLE_NAME=$1

cbt createtable "$TABLE_NAME"
cbt createfamily "$TABLE_NAME" id
cbt createfamily "$TABLE_NAME" loc

# Populate table with dummy data (3 records)
cbt set "$TABLE_NAME" e57c5e6a-609f-4371-86db-158304c2c1de#189 id:ride_id=e57c5e6a-609f-4371-86db-158304c2c1de
cbt set "$TABLE_NAME" e57c5e6a-609f-4371-86db-158304c2c1de#189 id:point_idx=189
cbt set "$TABLE_NAME" e57c5e6a-609f-4371-86db-158304c2c1de#189 loc:latitude=40.7854

cbt set "$TABLE_NAME" 33cb2a42-d9f5-4b64-9e8a-b5aa1d6e142f#132 id:ride_id=33cb2a42-d9f5-4b64-9e8a-b5aa1d6e142f
cbt set "$TABLE_NAME" 33cb2a42-d9f5-4b64-9e8a-b5aa1d6e142f#132 id:point_idx=132
cbt set "$TABLE_NAME" 33cb2a42-d9f5-4b64-9e8a-b5aa1d6e142f#132 loc:latitude=41.7854

cbt set "$TABLE_NAME" 8fa1905e-422c-49f6-8ea3-23c579504d83#1003 id:ride_id=8fa1905e-422c-49f6-8ea3-23c579504d83
cbt set "$TABLE_NAME" 8fa1905e-422c-49f6-8ea3-23c579504d83#1003 id:point_idx=1003
cbt set "$TABLE_NAME" 8fa1905e-422c-49f6-8ea3-23c579504d83#1003 loc:latitude=11.7854
