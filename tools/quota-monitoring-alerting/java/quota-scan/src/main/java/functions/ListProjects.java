/*
Copyright 2022 Google LLC

   Licensed under the Apache License, Version 2.0 (the "License");
   you may not use this file except in compliance with the License.
   You may obtain a copy of the License at

       http://www.apache.org/licenses/LICENSE-2.0

   Unless required by applicable law or agreed to in writing, software
   distributed under the License is distributed on an "AS IS" BASIS,
   WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   See the License for the specific language governing permissions and
   limitations under the License.
*/

package functions;

import com.google.api.client.googleapis.auth.oauth2.GoogleCredential;
import com.google.api.client.googleapis.javanet.GoogleNetHttpTransport;
import com.google.api.client.http.HttpTransport;
import com.google.api.client.json.JsonFactory;
import com.google.api.client.json.jackson2.JacksonFactory;
import com.google.api.core.ApiFuture;
import com.google.api.core.ApiFutures;
import com.google.api.gax.batching.BatchingSettings;
import com.google.api.services.cloudresourcemanager.CloudResourceManager;
import com.google.api.services.cloudresourcemanager.model.ListProjectsResponse;
import com.google.api.services.cloudresourcemanager.model.Project;
import com.google.cloud.functions.HttpFunction;
import com.google.cloud.functions.HttpRequest;
import com.google.cloud.functions.HttpResponse;
import com.google.cloud.pubsub.v1.Publisher;
import com.google.gson.Gson;
import com.google.gson.JsonElement;
import com.google.gson.JsonObject;
import com.google.gson.JsonParseException;
import com.google.protobuf.ByteString;
import com.google.pubsub.v1.ProjectTopicName;
import com.google.pubsub.v1.PubsubMessage;
import com.google.pubsub.v1.TopicName;
import java.io.IOException;
import java.io.PrintWriter;
import java.nio.charset.StandardCharsets;
import java.security.GeneralSecurityException;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import java.util.concurrent.ExecutionException;
import java.util.concurrent.TimeUnit;
import java.util.logging.Level;
import java.util.logging.Logger;
import org.threeten.bp.Duration;

/*
 * The ListProjects Cloud Function lists project Ids for a given parent node.
 * Parent node in this context could be an Organization Id or a folder Id
 * */
public class ListProjects implements HttpFunction {
  // Cloud Function Environment variable for Pub/Sub topic name to publish project Ids
  private static final String TOPIC_NAME = System.getenv("PUBLISH_TOPIC");
  // Cloud Function Environment variable for Home Project Id
  private static final String HOME_PROJECT_ID = System.getenv("HOME_PROJECT");
  // Cloud Function Environment variable for Threshold
  private static final String THRESHOLD = System.getenv("THRESHOLD");

  private static final Logger logger = Logger.getLogger(ListProjects.class.getName());

  private static final Gson gson = new Gson();

  /*
   * API to accept the Http request to Cloud Function.
   * */
  @Override
  public void service(HttpRequest request, HttpResponse response) throws IOException {
    String projectId = request.getFirstQueryParameter("projectId").orElse(HOME_PROJECT_ID);
    String threshold = request.getFirstQueryParameter("threshold").orElse(THRESHOLD);
    request.getQueryParameters();

    // Parse JSON request and check for "organization" and "projectId" fields
    String responseMessage = null;
    try {
      JsonElement requestParsed = gson.fromJson(request.getReader(), JsonElement.class);
      JsonObject requestJson = null;

      if (requestParsed != null && requestParsed.isJsonObject()) {
        requestJson = requestParsed.getAsJsonObject();
      }

      if (requestJson != null && requestJson.has("organizations")) {
        projectId = requestJson.get("projectId").getAsString();
      }
      logger.info("Publishing message to topic: " + TOPIC_NAME);
      logger.info("ProjectId: " + projectId);

      ByteString byteStr = ByteString.copyFrom(HOME_PROJECT_ID, StandardCharsets.UTF_8);
      PubsubMessage pubsubApiMessage = PubsubMessage.newBuilder().setData(byteStr).build();
      Publisher publisher =
          Publisher.newBuilder(ProjectTopicName.of(HOME_PROJECT_ID, TOPIC_NAME)).build();
      // Attempt to publish the message
      publisher.publish(pubsubApiMessage).get();
      responseMessage = "Message published.";
      List<String> projectIds = getProjectIds();
      publishMessages(projectIds);
    } catch (JsonParseException e) {
      logger.severe("Error parsing JSON: " + e.getMessage());
    } catch (InterruptedException | ExecutionException | GeneralSecurityException e) {
      logger.log(Level.SEVERE, "Error publishing Pub/Sub message: " + e.getMessage(), e);
      responseMessage = "Error publishing Pub/Sub message; see logs for more info.";
    }

    var writer = new PrintWriter(response.getWriter());
    writer.printf("projectId: %s!", HOME_PROJECT_ID);
    writer.printf("publish response: %s!", responseMessage);
  }

  /*
   * API to get accessible project Ids and create a list
   * */
  private static List<String> getProjectIds() throws IOException, GeneralSecurityException {
    List<String> projectIds = new ArrayList<>();
    // Instantiate Cloud Resource Manager Service and list projects.
    CloudResourceManager.Projects.List request =
        createCloudResourceManagerService().projects().list();
    // Iterate over the project list and fetch project Ids to create a list of project Ids
    ListProjectsResponse projectsResponse;
    do {
      projectsResponse = request.execute();
      if (projectsResponse.getProjects() == null) {
        continue;
      }
      for (Project project : projectsResponse.getProjects()) {
        projectIds.add(project.getProjectId());
        logger.info("Received Project Id: " + project.getProjectId());
      }
      request.setPageToken(projectsResponse.getNextPageToken());
    } while (projectsResponse.getNextPageToken() != null);
    return projectIds;
  }

  /*
   * API to publish message to Pub/Sub topic
   * */
  public static void publishMessages(List<String> projectIds)
      throws IOException, ExecutionException, InterruptedException {
    TopicName topicName = TopicName.of(HOME_PROJECT_ID, TOPIC_NAME);
    Publisher publisher = null;
    List<ApiFuture<String>> messageIdFutures = new ArrayList<>();

    try {
      // Batch settings control how the publisher batches messages
      long requestBytesThreshold = 5000L; // default : 1 byte
      long messageCountBatchSize = 100L; // default : 1 message

      Duration publishDelayThreshold = Duration.ofMillis(100); // default : 1 ms

      // Publish request get triggered based on request size, messages count & time since last
      // publish, whichever condition is met first.
      BatchingSettings batchingSettings =
          BatchingSettings.newBuilder()
              .setElementCountThreshold(messageCountBatchSize)
              .setRequestByteThreshold(requestBytesThreshold)
              .setDelayThreshold(publishDelayThreshold)
              .build();

      // Create a publisher instance with default settings bound to the topic
      publisher = Publisher.newBuilder(topicName).setBatchingSettings(batchingSettings).build();

      // schedule publishing one message at a time : messages get automatically batched
      for (String projectId : projectIds) {
        String message = projectId;
        ByteString data = ByteString.copyFromUtf8(message);
        PubsubMessage pubsubMessage = PubsubMessage.newBuilder().setData(data).build();

        // Once published, returns a server-assigned message id (unique within the topic)
        ApiFuture<String> messageIdFuture = publisher.publish(pubsubMessage);
        messageIdFutures.add(messageIdFuture);
      }
    } finally {
      // Wait on any pending publish requests.
      List<String> messageIds = ApiFutures.allAsList(messageIdFutures).get();

      System.out.println("Published " + messageIds.size() + " messages with batch settings.");

      if (publisher != null) {
        // When finished with the publisher, shutdown to free up resources.
        publisher.shutdown();
        publisher.awaitTermination(1, TimeUnit.MINUTES);
      }
    }
  }

  /*
   * API to get an instance of Cloud Resource Manager Service
   * */
  private static CloudResourceManager createCloudResourceManagerService()
      throws IOException, GeneralSecurityException {
    HttpTransport httpTransport = GoogleNetHttpTransport.newTrustedTransport();
    JsonFactory jsonFactory = JacksonFactory.getDefaultInstance();

    GoogleCredential credential = GoogleCredential.getApplicationDefault();
    if (credential.createScopedRequired()) {
      credential =
          credential.createScoped(Arrays.asList("https://www.googleapis.com/auth/cloud-platform"));
    }

    return new CloudResourceManager.Builder(httpTransport, jsonFactory, credential)
        .setApplicationName("Google-CloudResourceManagerSample/0.1")
        .build();
  }
}
