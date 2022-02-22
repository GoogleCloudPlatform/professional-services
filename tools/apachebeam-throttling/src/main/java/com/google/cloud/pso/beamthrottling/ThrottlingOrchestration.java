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

package com.google.cloud.pso.dataflowthrottling;

import com.google.gson.Gson;
import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStreamReader;
import java.io.OutputStream;
import java.net.HttpURLConnection;
import java.net.URL;
import org.apache.beam.sdk.Pipeline;
import org.apache.beam.sdk.PipelineResult;
import org.apache.beam.sdk.coders.Coder;
import org.apache.beam.sdk.coders.StringUtf8Coder;
import org.apache.beam.sdk.coders.VarIntCoder;
import org.apache.beam.sdk.io.TextIO;
import org.apache.beam.sdk.io.gcp.pubsub.PubsubIO;
import org.apache.beam.sdk.options.Description;
import org.apache.beam.sdk.options.PipelineOptions;
import org.apache.beam.sdk.options.PipelineOptionsFactory;
import org.apache.beam.sdk.options.ValueProvider;
import org.apache.beam.sdk.transforms.DoFn;
import org.apache.beam.sdk.transforms.ParDo;
import org.apache.beam.sdk.transforms.windowing.FixedWindows;
import org.apache.beam.sdk.transforms.windowing.Window;
import org.apache.beam.sdk.values.PCollection;
import org.apache.beam.sdk.values.PCollectionTuple;
import org.joda.time.Duration;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

/**
 * This class is defined to read from source, transform using com.google.cloud.pso.dataflowthrottling.DynamicThrottlingTransform
 * and write to sink. While using com.google.cloud.pso.dataflowthrottling.DynamicThrottlingTransform a user has to implement
 * clientCall functional interface where each event is sent to the external service for processing.
 * Sample run command:
 * # Set the runner
 * RUNNER=DataflowRunner
 * # Build the template
 * mvn compile exec:java \
 * -Dexec.mainClass=com.google.cloud.pso.dataflowthrottling.ThrottlingOrchestration \
 * -Dexec.cleanupDaemonThreads=false \
 * -Dexec.args=" \
 * --project=${PROJECT_ID} \
 * --stagingLocation=gs://${PROJECT_ID}/staging \
 * --tempLocation=gs://${PROJECT_ID}/temp \
 * --inputFilePattern=gs://${PROJECT_ID}/input \
 * --outputFilePattern=gs://${PROJECT_ID}/output \
 * --runner=DataflowRunner \
 * ADDITIONAL PARAMETERS HERE"
 */
public class ThrottlingOrchestration {

    /**
     * The logger to output status messages to.
     */
    private static final Logger LOG = LoggerFactory.getLogger(ThrottlingOrchestration.class);

    /**
     * The {@link Options} class provides the custom execution options passed by the executor at the
     * command-line.
     */
    public interface Options extends PipelineOptions {
        @Description("This name of the topic which data should be coming from")
        ValueProvider<String> getInputTopic();

        void setInputTopic(ValueProvider<String> value);

        @Description("The file pattern to read records from storage object")
        ValueProvider<String> getInputFilePattern();

        void setInputFilePattern(ValueProvider<String> value);

        @Description("The file pattern to write records to storage object")
        ValueProvider<String> getOutputFilePattern();

        void setOutputFilePattern(ValueProvider<String> value);
    }

    /**
     * The main entry-point for pipeline execution. This method will start the pipeline but will not
     * wait for it's execution to finish. If blocking execution is required, use the {@link
     * {@code result.waitUntilFinish()} on the {@link PipelineResult}.
     *
     * @param args The command-line args passed by the executor.
     */
    public static void main(String[] args) throws IOException {
        Options options = PipelineOptionsFactory.fromArgs(args).as(Options.class);
        run(options);
    }

    /**
     * Runs the pipeline to completion with the specified options. This method does not wait until the
     * pipeline is finished before returning.
     *
     * @return The pipeline result.
     */

    public static PipelineResult run(Options options) throws IOException {

        /**
         * @clientCall LambdaFunction.
         * com.google.cloud.pso.dataflowthrottling.DynamicThrottlingTransform.Clientcall<InputType, OutputType[for accepted requests]> clientCall = input ->{
         *      Process the input.
         *      response = "Response from the external service"
         *      if(response is Out of Quota Error){
         *          throw new ThrottlingException;
         *      }
         *      else{
         *          return request_response;
         *      }
         * };
         */
        DynamicThrottlingTransform.ClientCall<String, Integer> clientCall = csvLine -> {
            BufferedReader bufferedReader = null;
            HttpURLConnection con = null;
            URL url = null;

            url = new URL(null, "http://localhost:8500");
            con = (HttpURLConnection) url.openConnection();
            con.setConnectTimeout(5000);
            con.setRequestMethod("POST");
            con.setRequestProperty("Content-Length", Integer.toString(csvLine.toString().getBytes().length));
            con.setDoOutput(true);

            OutputStream outputStream = con.getOutputStream();
            outputStream.write(csvLine.toString().getBytes());
            outputStream.flush();
            outputStream.close();

            if (con.getResponseCode() == 429) {
                throw new ThrottlingException("Server returned HTTP response code: 429");
            }

            InputStreamReader inputStreamReader = new InputStreamReader(con.getInputStream());
            bufferedReader = new BufferedReader(inputStreamReader);
            StringBuilder stringBuilder = new StringBuilder();
            char[] charBuffer = new char[128];
            int bytesRead;
            while ((bytesRead = bufferedReader.read(charBuffer)) > 0) {
                stringBuilder.append(charBuffer, 0, bytesRead);
            }
            inputStreamReader.close();
            bufferedReader.close();
            con.disconnect();

            return con.getResponseCode();

        };

        /*
          Define coder and set it to SuccessTagTransform
         */
        Coder<Integer> intCoder = VarIntCoder.of();

        /**
         * This defines a strategy that is applied when a request is throttled by an external service or by a DataflowThrottlingTransform itself
         */
        ThrottlingStrategy throttlingStrategy = ThrottlingStrategy.DLQ;

        // Create the pipeline
        Pipeline pipeline = Pipeline.create(options);
        /*
          Steps:
           1) Read something
           2) Transform something
           3) Write something
         */
        // Pipeline code goes here
        LOG.info("Building pipeline...");

        PCollection<String> events = pipeline.apply("Read PubSub Events", PubsubIO.readStrings().fromSubscription(options.getInputTopic()))
                .apply(" Window", Window.into(new GlobalWindows()));
        //PCollection<String> events=pipeline.apply("Read Events", TextIO.read().from(options.getInputFilePattern()));

        DynamicThrottlingTransform<String, Integer> dynamicThrottlingTransform = new DynamicThrottlingTransform.Builder<String, Integer>(clientCall, StringUtf8Coder.of(), 50000)
                .withKInRejectionProbability(2).withNumberOfGroups(1).withBatchInterval(java.time.Duration.ofSeconds(1)).withResetCounterInterval(java.time.Duration.ofMinutes(1)).withThrottlingStrategy(throttlingStrategy).build();

        PCollectionTuple enriched = events.apply(dynamicThrottlingTransform);
        enriched.get(dynamicThrottlingTransform.getSuccessTag()).setCoder(intCoder).apply("SuccessTag", ParDo.of(new DoFn<Integer, String>() {
            @DoFn.ProcessElement
            public void processElement(ProcessContext context) {
                context.output(context.element().toString());
            }
        })).apply("WritingSuccessTag", TextIO.write().to(options.getOutputFilePattern() + "successTag").withWindowedWrites().withNumShards(1));
        enriched.get(dynamicThrottlingTransform.getErrorTag()).apply("ErrorTag", ParDo.of(new DoFn<DynamicThrottlingTransform.Result<String>, String>() {
            @DoFn.ProcessElement
            public void processElement(ProcessContext context) {
                Gson gson = new Gson();
                String json = gson.toJson(context.element());
                context.output(json);
            }
        })).apply("WritingErrorTag", TextIO.write().to(options.getOutputFilePattern() + "errorTag").withWindowedWrites().withNumShards(1));
        enriched.get(dynamicThrottlingTransform.getThrottlingTag()).apply("ThrottlingTag", ParDo.of(new DoFn<DynamicThrottlingTransform.Result<String>, String>() {
            @DoFn.ProcessElement
            public void processElement(ProcessContext context) {
                Gson gson = new Gson();
                String json = gson.toJson(context.element());
                context.output(json);
            }
        })).apply("WritingThrottlingTag", TextIO.write().to(options.getOutputFilePattern() + "throttlingTag").withWindowedWrites().withNumShards(1));

        return pipeline.run();
    }
}
