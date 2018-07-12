/*
 * Copyright 2017 Google Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

package com.google.cloud.tools.sce.aurinko.broker;

import java.io.File;
import java.io.IOException;
import java.util.concurrent.CountDownLatch;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.github.fge.jsonschema.core.exceptions.ProcessingException;
import com.google.api.core.ApiFuture;
import com.google.api.core.ApiFutures;
import com.google.cloud.ServiceOptions;
import com.google.cloud.pubsub.v1.Publisher;
import com.google.cloud.tools.sce.aurinko.validator.Validator;
import com.google.protobuf.ByteString;
import com.google.pubsub.v1.ProjectTopicName;
import com.google.pubsub.v1.PubsubMessage;
/**
 * The DataBroker facilitates sending data to GCP PubSub.  This is accomplished
 * through either the send method or upload method.  Primary difference between the
 * two is that the send method is used for payloads under 10MB.  The upload method
 * stores payaloads of more than 10MB in Google Cloud Storage, and then publishes
 * a message with the location of the stored file.  Note the upload method is not
 * implemented in 1.0-SNAPSHOT.
 * 
 * @version 1.0-SNAPSHOT
 */
public class DataBroker {

    private Publisher publisher;
    private String projectId;
    private String topicId;
    private Validator validator;
   
    /**
     * Constructor
     * @param topicId   The ID of the topic to which to publish.
     * @throws ProcessingException
     * @throws IOException
     */
    public DataBroker(String topicId) throws IOException, ProcessingException {
        this(ServiceOptions.getDefaultProjectId(), topicId);
  
    }

    /**
     * Constructor
     * @param projectId The ID of the project where the message topic resides.
     * @param topicId   The ID of the topic to which to publish.
     * @throws ProcessingException
     * @throws IOException
     */
    public DataBroker(String projectId, String topicId) throws IOException, ProcessingException {
        this.projectId = projectId;
        this.topicId = topicId;
        this.validator = new Validator();
    }

    /**
     * Constructor - This is primarily for unit testing where one would want
     *               to insert a mock validator.
     * @param projectId The ID of the project where the message topic resides.
     * @param topicId   The ID of the topic to which to publish.
     * @param validator The Json Validator to use
     * @throws ProcessingException
     * @throws IOException
     */
    public DataBroker(String projectId, String topicId, Validator validator) {
        this.projectId = projectId;
        this.topicId = topicId;
        this.validator = validator;
    }

    /**
     * The send message is used to publish payloads of less than 10MB to Pub/Sub.
     * 
     * @param payload   The string payload to send.  Do not wait for the callback to complete.
     * @return          The DataBrokerMessage representation of the message that was sent.
     */
    public DataBrokerMessage send(String payload) throws Exception {
        return this.send(payload, false);
    }

    /**
     * The send message is used to publish payloads of less than 10MB to Pub/Sub.
     * 
     * @param payload   The JsonObject payload to send.  Do not wait for the callback to complete.
     * @return          The DataBrokerMessage representation of the message that was sent.
     */
    public DataBrokerMessage send(JsonNode payload) throws Exception {
        return this.send(payload, false);
    }

    /**
     * The send message is used to publish payloads of less than 10MB to Pub/Sub.
     * 
     * @param payload   The string payload to send.
     * @param wait      Whether or not to wait for the asynchronous publish to complete. 
     * @return          The DataBrokerMessage representation of the message that was sent.
     */
    public DataBrokerMessage send(String payload, boolean wait) throws Exception {
        ObjectMapper mapper = new ObjectMapper();
        JsonNode payloadJson = mapper.readTree(payload);
        return this.send(payloadJson, wait);
        
    }

    /**
     * The send message is used to publish payloads of less than 10MB to Pub/Sub.
     * 
     * @param payload   The JsonObject payload to send.
     * @param wait      Whether or not to wait for the asynchronous publish to complete. 
     * @return          The DataBrokerMessage representation of the message that was sent.
     */
    public DataBrokerMessage send(JsonNode payload, boolean wait) throws Exception {
        // Create a new message for the data broker
        validator.validate(payload, true);
        
        DataBrokerMessage message = new DataBrokerMessage(payload, this.topicId, this.projectId);
        return this.publish(message, wait);
    }

    /**
     * TODO: Not fully implemented yet.
     */
    public DataBrokerMessage upload(File fileToUpload) {
        return null;

    }
    
    /**
     * Publish the message to GCP PubSub.  Because the actual publishing of the messages
     * is asynchronous, the optional boolean "wait" parameter will control whether or not
     * this method waits for the callback to complete.
     * <p>
     * If "wait" is true, then the DataBrokerMessage being returned will have additional 
     * information such as the messageId on success, or a Throwable on failure.
     * 
     * @param message   The DataBrokerMessage to publish.
     * @param wait      Whether or not to wait for the asynchronous publish to complete.
     * @return          The DataBrokerMessage that was published with additional details.
     * @throws Exception
     */
    private DataBrokerMessage publish(DataBrokerMessage message, boolean wait) throws Exception {
        CountDownLatch doneSignal = null;
        this.publisher = this.getPublisher();

        try {
            
            // Create a callback
            DataBrokerCallback callback = new DataBrokerCallback();
            // Create an API Future Object;
            ApiFuture<String> future = this.getFuture(message);
            // If we are waiting for the callback to complete, create
            // a countdown latch.
            if (wait) {
                doneSignal = new CountDownLatch(1);
                callback.setLatch(doneSignal);
            }
            // Add the asynchronous callback to handle success / failure
            ApiFutures.addCallback(future, callback);

            // If we are waiting, do that, wait.
            if (wait) {
                doneSignal.await();
                // Either the message ID or failure object will be populated
                // and not both at the same time.
                if (callback.getMessageId() != null) {
                    message.setMessageId(callback.getMessageId());
                } else if (callback.getFailure() != null) {
                    message.setFailure(callback.getFailure());
                }
            }
        
        }   finally {
            
            if (this.publisher != null) {
                // When finished with the publisher, shutdown to free up resources.
                this.publisher.shutdown();
            }
        }
        return message;
    }



    private ApiFuture<String> getFuture(DataBrokerMessage message) throws IOException {
        ObjectMapper mapper = new ObjectMapper();
        // convert message to JSON then a string
        String messageString = mapper.writeValueAsString(message);
        //Convert the message string to a byte string
        ByteString data = ByteString.copyFromUtf8(messageString);
        // Build a new PubsubMessage
        PubsubMessage pubsubMessage = PubsubMessage.newBuilder()
            .setData(data)
            .build();
        // Schedule a message to be published, messages are automatically batched
        ApiFuture<String> future = this.publisher.publish(pubsubMessage);

        return future;
    }

    private Publisher getPublisher() throws IOException {
        ProjectTopicName topicName = ProjectTopicName.of(this.projectId, this.topicId);
        return Publisher.newBuilder(topicName).build();
    }
}

