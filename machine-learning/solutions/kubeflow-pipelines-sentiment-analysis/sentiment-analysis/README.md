To run locally
mvn compile exec:java -Dexec.mainClass=SentimentAnalysis \
  -Dexec.args="--inputPath=<INPUT_FILE_PATH(S)> \
               --outputPath=<OUTPUT_FILE_PATH(S)> \
               --windowDuration=280 \
               --windowPeriod=1"
  -Pdirect-runner


To run with Dataflow
mvn compile exec:java \
  --define exec.mainClass=SentimentAnalysis \
  --define exec.args="--runner=DataflowRunner \
                      --gcpTempLocation=gs://<BUCKET_NAME>/tmp \
                      --inputPath=gs://<BUCKET_NAME>/<FILE_PATH(S)> \
                      --outputPath=gs://<BUCKET_NAME>/output/output \
                      --windowDuration=280 \
                      --windowPeriod=1" \
  --activate-profiles dataflow-runner
