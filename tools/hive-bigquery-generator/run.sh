mkdir -p output logs
rm -rf output
java \
  -Xmx8G \
  -jar hive-bq-external-tool-0.0.1-SNAPSHOT.jar  > logs/execution_$(date +'%Y%m%d_%H%M%S').log 2>&1 &