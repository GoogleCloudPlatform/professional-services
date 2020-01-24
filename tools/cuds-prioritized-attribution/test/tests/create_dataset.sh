#/bin/bash
# Copyright 2019 Google LLC. This software is provided as-is, without warranty or representation for any use or purpose. Your use of it is subject to your agreements with Google.
dataset=$1
bq rm -r -f -d ${dataset}
bq mk -d --default_table_expiration 360000 ${dataset}