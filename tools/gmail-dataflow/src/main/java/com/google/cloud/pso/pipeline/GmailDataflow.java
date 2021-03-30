/*
 * Copyright (C) 2018 Google Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

package com.google.cloud.pso.pipeline;

import com.google.gson.JsonObject;
import com.google.gson.JsonParser;
import java.io.IOException;
import java.util.Map;
import org.apache.beam.sdk.Pipeline;
import org.apache.beam.sdk.io.gcp.pubsub.PubsubIO;
import org.apache.beam.sdk.options.Default;
import org.apache.beam.sdk.options.Description;
import org.apache.beam.sdk.options.PipelineOptionsFactory;
import org.apache.beam.sdk.options.StreamingOptions;
import org.apache.beam.sdk.options.Validation.Required;
import org.apache.beam.sdk.transforms.DoFn;
import org.apache.beam.sdk.transforms.ParDo;
import org.apache.beam.sdk.transforms.windowing.FixedWindows;
import org.apache.beam.sdk.transforms.windowing.Window;
import org.joda.time.Duration;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

/**
 * Build and execute the pipeline as follows: 

 // If you want to create a template and not run job then use the following option
--templateLocation=${PIPELINE_FOLDER}/template \


// Compile and upload the template to GCS for dataflow
RUNNER=DataflowRunner 
PROJECT_ID=<your-project-id>
BUCKET_NAME=<your-bucket-name>
TOPIC_NAME="<your-topic-name>"
PIPELINE_FOLDER=gs://${BUCKET_NAME}/dataflow/pipelines/gmail-dataflow
USE_SUBSCRIPTION=false 
OUTPUT_TOPIC="<your-output-topic-name>"

mvn compile exec:java \
-Dexec.mainClass=com.google.cloud.pso.pipeline.GmailDataflow \
-Dexec.cleanupDaemonThreads=false \
-Dexec.args=" \
--project=${PROJECT_ID} \
--tempLocation=${PIPELINE_FOLDER}/temp \
--stagingLocation=${PIPELINE_FOLDER}/staging \
--runner=${RUNNER} \
--inputTopic=projects/$PROJECT_ID/topics/$TOPIC_NAME \
--outputTopic=projects/$PROJECT_ID/topics/$OUTPUT_TOPIC \
--output=gs://$BUCKET_NAME/samples/output \
--windowSize=2 \
--truncateSize=4000 \
--defaultWorkerLogLevel=DEBUG"

// Run locally
RUNNER=DirectRunner
mvn clean compile exec:java -Dexec.mainClass=com.google.cloud.pso.pipeline.GmailDataflow \
-Dexec.cleanupDaemonThreads=false \
-Dexec.args=" \
--project=${PROJECT_ID} \
--runner=${RUNNER} \
--inputTopic=projects/$PROJECT_ID/topics/$TOPIC_NAME \
--outputTopic=projects/$PROJECT_ID/topics/$OUTPUT_TOPIC \
--output=gs://$BUCKET_NAME/samples/output \
--windowSize=2 \
--truncateSize=6" 

# Once the template location is populated with the jar files then they can be launched
# using the gcloud dataflow command as below
export GOOGLE_APPLICATION_CREDENTIALS=<service-account-json-file-location>
gcloud auth activate-service-account --key-file=<service-account-json-file-location>

JOB_NAME=gmail-push-$USER-`date +"%Y%m%d-%H%M%S%z"`
gcloud dataflow jobs run ${JOB_NAME} \
--region=us-central1 \
--service-account-email="<your-service-account-email>" \
--gcs-location=${PIPELINE_FOLDER}/template \
--worker-zone=us-east1-d \
--parameters \
"inputTopic=projects/${PROJECT_ID}/topics/${TOPIC_NAME},\
"
 */
public class GmailDataflow {

  public interface GmailToPubsubOptions extends StreamingOptions {
    @Description("The Cloud Pub/Sub topic to read from.")
    @Required
    String getInputTopic();

    void setInputTopic(String value);

    @Description("Window size in number of minutes.")
    @Default.Integer(1)
    Integer getWindowSize();

    void setWindowSize(Integer value);

    @Description("Path of the output file including its filename prefix.")
    @Required
    String getOutput();

    void setOutput(String value);

    @Description("The Cloud Pub/Sub topic to write the output to.")
    @Required
    String getOutputTopic();

    void setOutputTopic(String value);

    @Description("Truncate size of the output message.")
    @Default.Integer(1)
    Integer getTruncateSize();

    void setTruncateSize(Integer value);
  }

  public static void main(String[] args) throws IOException {
    GmailToPubsubOptions options = PipelineOptionsFactory
      .fromArgs(args)
      .withValidation()
      .as(GmailToPubsubOptions.class);

    options.setStreaming(true);

    Pipeline pipeline = Pipeline.create(options);

    pipeline
      // 1) Read string messages from a Pub/Sub topic.
      .apply(
        "Read PubSub Messages",
        PubsubIO.readStrings().fromTopic(options.getInputTopic())
      )
      // 2) Group the messages into fixed-sized minute intervals.
      .apply(
        "Windowing",
        Window.into(
          FixedWindows.of(Duration.standardMinutes(options.getWindowSize()))
        )
      )
      .apply(
        "Gmail Message Get",
        ParDo.of(new GmailGet(options.getTruncateSize()))
      )
      .apply(
        "Write to PubSub",
        PubsubIO.writeStrings().to(options.getOutputTopic())
      );
    pipeline.run();
  }

  public static class GmailGet extends DoFn<String, String> {

    private static final Logger LOG = LoggerFactory.getLogger(GmailGet.class);

    public GmailGet(int truncateSize) {
      this.truncateSize = truncateSize;
    }

    private int truncateSize = 4096;
    private static final long serialVersionUID = 1234567L;

    @ProcessElement
    public void processElement(ProcessContext c) {
      GmailApiDriver t = new GmailApiDriver(truncateSize);
      String json = c.element();
      JsonObject message = new JsonParser().parse(json).getAsJsonObject();
      String user = message.get("emailAddress").toString().replace("\"", "");
      String historyId = message.get("historyId").toString();
      LOG.debug(
        "Processing for {user_email: " +
        user +
        ", history_id: " +
        historyId +
        "}"
      );
      Map<String, String> m4 = t.printMessage(user, historyId);
      for (String m : m4.values()) {
        c.output(m);
      }
    }
  }
}