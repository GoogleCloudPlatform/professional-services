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

package com.google.cloud.pso.pubsub;

import com.beust.jcommander.JCommander;
import com.beust.jcommander.ParameterException;
import com.google.cloud.pso.pubsub.common.ObjectPublisher;

import java.io.IOException;

/**
 * The {@link EmployeePublisherMain} is a sample program that demonstrates how to use Pub/Sub client
 * API to publish Avro encoded messages to Cloud Pub/Sub. This program also demonstrates an approach
 * for using {@link com.google.api.gax.batching.BatchingSettings} to batch records that get
 * published.
 * <p>
 * <p><b>Pipeline Requirements</b>
 * <p>
 * <ul>
 * <li>An existing Cloud Pub/Sub topic to publish records to.
 * </ul>
 * <p>
 * Set some input parameters
 * PUBSUB_OUTPUT_TOPIC=projects/${PROJECT_ID}/topics/topic-name
 * NUM_OF_MESSAGES_TO_PUBLISH=num_of_records_to_publish
 * <p>
 * <p><b>Example Usage</b>
 * <p>
 * <pre>
 *
 * # Build and execute
 * mvn compile exec:java \
 * -Dexec.mainClass=com.google.cloud.pso.pubsub.EmployeePublisherMain \
 * -Dexec.cleanupDaemonThreads=false \
 * -Dexec.args=" \
 * --topic PUBSUB_OUTPUT_TOPIC \
 * --numberOfMessages NUM_OF_MESSAGES_TO_PUBLISH
 * </pre>
 */
public class EmployeePublisherMain {
    /**
     * The main entry point for the {@link EmployeePublisherMain} class.
     *
     * @param args program arguments
     * @throws IOException
     */
    public static void main(String[] args) throws IOException {

        ObjectPublisher.Args parsedArgs = new ObjectPublisher.Args();
        JCommander jCommander = JCommander.newBuilder().addObject(parsedArgs).build();
        jCommander.setProgramName(EmployeePublisherMain.class.getCanonicalName());

        try {
            jCommander.parse(args);
        } catch (ParameterException e) {
            jCommander.usage();
            return;
        }

        if (parsedArgs.isHelp()) {
            jCommander.usage();
        } else {

            EmployeePublisher publisher = new EmployeePublisher();
            publisher.publish(parsedArgs);
        }
    }
}
