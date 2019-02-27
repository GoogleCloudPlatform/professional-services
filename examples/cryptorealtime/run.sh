#!/usr/bin/env bash
mvn compile -X exec:java \
  -Dexec.mainClass="run.RunThePipeline" \
  -Dexec.args="--project=$1 \
  --bigtableClusterId=$2 \
  --bigtableInstanceId=$2 \
  --bigtableZoneId=${ZONE} \
  --stagingLocation=$3 \
  --runner=DataFlowRunner \
  --bigtableTableId=$4 \
  --bigtableProjectId=$1 \
  --bigtableFamily=$5"
