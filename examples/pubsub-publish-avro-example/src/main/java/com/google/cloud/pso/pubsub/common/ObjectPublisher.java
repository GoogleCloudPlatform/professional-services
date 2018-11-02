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

package com.google.cloud.pso.pubsub.common;

import com.beust.jcommander.IStringConverter;
import com.beust.jcommander.Parameter;
import com.google.api.core.ApiFuture;
import com.google.api.gax.batching.BatchingSettings;
import com.google.cloud.pubsub.v1.Publisher;
import com.google.protobuf.ByteString;
import com.google.pubsub.v1.ProjectTopicName;
import com.google.pubsub.v1.PubsubMessage;
import org.threeten.bp.Duration;

import java.io.IOException;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.atomic.AtomicLong;

/**
 * A generic class that can be used to publish any object to Pub/Sub with configurable {@link
 * BatchingSettings}
 *
 * @param <T> Type of objects to publish.
 */
public abstract class ObjectPublisher<T> {
    private static final long DEFAULT_THREAD_SLEEP = 1000L;
    private Publisher publisher;
    private AtomicLong awaitedFutures;
    private ExecutorService executor = Executors.newCachedThreadPool();

    /**
     * Initializes the class by creating a {@link Publisher} if one does not exist. It utilizes
     * the settings provided by {@link Args} to set the appropriate {@link BatchingSettings} to
     * be used for publishing.
     *
     * @param args Argument encapsulating the values to be used for the {@link BatchingSettings}.
     */
    private void init(Args args) {
        if (this.publisher != null) {
            return;
        }
        this.awaitedFutures = new AtomicLong();

        ProjectTopicName topicName = ProjectTopicName.parse(args.topic);
        // BatchSettings to be used for publishing the messages.
        BatchingSettings batchingSettings =
                BatchingSettings.newBuilder()
                        .setElementCountThreshold(args.elementCount)
                        .setDelayThreshold(args.delayThreshold)
                        .setRequestByteThreshold(args.bytesThreshold)
                        .setIsEnabled(true)
                        .build();

        com.google.cloud.pubsub.v1.Publisher.Builder builder =
                com.google.cloud.pubsub.v1.Publisher.newBuilder(topicName)
                        .setBatchingSettings(batchingSettings);
        try {
            this.publisher = builder.build();
        } catch (IOException e) {
            System.out.println("Could not create publisher: " + e);
            System.exit(-1);
        }
    }

    /**
     * Publishes the record asynchronously and adds a listener for the {@link ApiFuture}
     * that is returned.
     *
     * @param record The record to be published.
     * @throws IOException
     */
    private void publish(T record) throws IOException {
        awaitedFutures.incrementAndGet();
        ByteString byteString = serialize(record);
        PubsubMessage message = PubsubMessage.newBuilder().setData(byteString).build();
        ApiFuture<String> response = publisher.publish(message);
        response.addListener(
                () -> {
                    try {
                        response.get();
                    } catch (Exception e) {
                        System.out.println("Could not publish a message: " + e);
                    } finally {
                        awaitedFutures.decrementAndGet();
                    }
                },
                executor);
    }

    /**
     * This method is used to configure {@link ObjectPublisher} using custom {@link Args} and to
     * publish records to Pub/Sub
     *
     * @param args         Parameters to configure {@link BatchingSettings} and other properties
     * @param objectReader A {@link ObjectReader} class that provides objects to publish
     * @throws IOException
     */
    public void run(Args args, ObjectReader<T> objectReader) throws IOException {
        init(args);
        long count = 0;
        while (objectReader.hasNext()) {
            T record = objectReader.next();
            publish(record);
            if (++count % 10000 == 0) {
                System.out.println("Published " + count + " messages.");
            }
        }
        if (count % 10000 != 0) {
            System.out.println("Published " + count + " messages.");
        }
        waitForPublishes();
    }

    /**
     * Method to serialize the object to be published into a ByteString.
     *
     * @param record object to serliaze into a ByteString
     * @return ByteString representation of the input record
     * @throws IOException
     */
    public abstract ByteString serialize(T record) throws IOException;

    /**
     * Waits for all the {@link ApiFuture} to complete before shutting down
     * the {@link ExecutorService}
     */
    private void waitForPublishes() {
        try {
            while (awaitedFutures.longValue() > 0) {
                TimeUnit.MILLISECONDS.sleep(DEFAULT_THREAD_SLEEP);
            }
        } catch (InterruptedException e) {
            System.out.println("Error while waiting for completion: " + e);
        }
        executor.shutdown();
    }

    /**
     * Input arguments with default values to be used by {@link ObjectPublisher}.
     */
    public static class Args {
        @Parameter(
                names = {"--topic", "-t"},
                required = true,
                description = "The Pub/Sub topic to write messages to")
        private String topic = null;

        @Parameter(
                names = {"--elementCount", "-c"},
                description = "The number of elements to be batched in each request.")
        private Long elementCount = 500L; // default value for elementCount

        @Parameter(
                names = {"--delayThreshold", "-d"},
                converter = DurationConverter.class,
                description = "Delay threshold in milliseconds.")
        private Duration delayThreshold = Duration.ofMillis(500L); // default value for delayThreshold

        /**
         * This is not used directly by the publisher but is provided in case the user wishes
         * to limit the number of messages to be published.
         */
        @Parameter(
                names = {"--numberOfMessages", "-n"},
                description = "Number of sample messages to publish to Pub/Sub")
        private Long numOfMessages = 100000L; // default value for numMessages

        @Parameter(
                names = {"--bytesThreshold", "-b"},
                description = "Batch threshold bytes.")
        private Long bytesThreshold = 1024L; // default value for bytesThreshold

        @Parameter(
                names = {"--help", "-h"},
                help = true)
        private boolean help = false;

        public Long getNumOfMessages() {
            return numOfMessages;
        }

        public boolean isHelp() {
            return help;
        }
    }

    /**
     * A helper implementation of {@link IStringConverter} to convert a user provided
     * string value (in milliseconds) to a {@link Duration} object.
     */
    private static class DurationConverter implements IStringConverter<Duration> {
        @Override
        public Duration convert(String value) {
            return Duration.ofMillis(Long.parseLong(value));
        }
    }
}
