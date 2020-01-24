#/bin/bash
# Copyright 2019 Google LLC. This software is provided as-is, without warranty or representation for any use or purpose. Your use of it is subject to your agreements with Google.

dataset=$1
table=$2
rm -rf tests/${table}/commitments_load.json
rm -rf tests/${table}/export_load.json
bq rm -f ${dataset}.${table}_export
bq rm -f ${dataset}.${table}_commitments