/*
Copyright 2021 Google LLC

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


import com.google.api.core.ApiFuture;
import com.google.api.core.ApiFutures;
import com.google.api.gax.batching.BatchingSettings;
import com.google.api.services.cloudresourcemanager.CloudResourceManager;
import com.google.api.services.cloudresourcemanager.model.Ancestor;
import com.google.api.services.cloudresourcemanager.model.GetAncestryRequest;
import com.google.api.services.cloudresourcemanager.model.GetAncestryResponse;
import com.google.cloud.compute.v1.*;
import com.google.cloud.functions.BackgroundFunction;
import com.google.cloud.functions.Context;
import com.google.cloud.pubsub.v1.Publisher;
import com.google.protobuf.ByteString;
import com.google.pubsub.v1.PubsubMessage;
import com.google.pubsub.v1.TopicName;
import functions.eventpojos.Notification;
import functions.eventpojos.PubSubMessage;
import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.security.GeneralSecurityException;
import java.util.*;
import java.util.concurrent.ExecutionException;
import java.util.concurrent.TimeUnit;
import java.util.logging.Level;
import java.util.logging.Logger;
import org.threeten.bp.Duration;

/*
 * The ScanProject Cloud Function Scan project Quotas for a given project Id.
 * The background cloud function is triggered by Pub/Sub topic
 * */
public class ScanProject implements BackgroundFunction<PubSubMessage> {
  // Cloud Function Environment variable for Pub/Sub topic name to publish project Quotas
  private static final String PUBLISH_TOPIC = System.getenv("PUBLISH_TOPIC");
  // Cloud Function Environment variable for Pub/Sub topic name to publish notification
  public static final String NOTIFICATION_TOPIC = System.getenv("NOTIFICATION_TOPIC");
  // Cloud Function Environment variable for Home Project Id
  private static final String HOME_PROJECT_ID = System.getenv("HOME_PROJECT");
  // Cloud Function Environment variable for Threshold
  public static final String THRESHOLD = System.getenv("THRESHOLD");

  private static final Logger logger = Logger.getLogger(ScanProject.class.getName());

  /*
   * API to accept request to Cloud Function
   * */
  @Override
  public void accept(PubSubMessage message, Context context) {
    if (message.getData() == null) {
      logger.info("No message provided");
      return;
    }
    // project Id received from Pub/Sub topic
    String projectId =
        new String(
            Base64.getDecoder().decode(message.getData().getBytes(StandardCharsets.UTF_8)),
            StandardCharsets.UTF_8);
    try {
      CloudResourceManager cloudResourceManagerService =
          ScanProjectHelper.createCloudResourceManagerService();
      // Fetch Org id of the project
      String orgId = getOrgId(cloudResourceManagerService, projectId);
      logger.info("ProjectId: " + projectId);
      // Get project quota
      getProjectQuota(orgId, projectId);
    } catch (ExecutionException | InterruptedException | IOException | GeneralSecurityException e) {
      logger.log(Level.SEVERE, "Error publishing Pub/Sub message: " + e.getMessage(), e);
    }
    logger.info("ProjectId: " + projectId);
  }

  /*
   * API to get Organization Id for project Id
   * */
  private static String getOrgId(CloudResourceManager cloudResourceManagerService, String projectId)
      throws IOException, GeneralSecurityException {
    GetAncestryRequest requestBody = new GetAncestryRequest();

    CloudResourceManager.Projects.GetAncestry request =
        cloudResourceManagerService.projects().getAncestry(projectId, requestBody);

    GetAncestryResponse response = request.execute();
    Iterator<Ancestor> ancestorIterator = response.getAncestor().iterator();
    while ((ancestorIterator.hasNext())) {
      Ancestor ancestor = ancestorIterator.next();
      if (ancestor.getResourceId().getType().equals("organization"))
        return ancestor.getResourceId().getId();
    }
    return null;
  }

  /*
   * API to get project quota for project Id
   * */
  private static void getProjectQuota(String orgId, String projectId)
      throws InterruptedException, ExecutionException {
    TopicName topicName = TopicName.of(HOME_PROJECT_ID, PUBLISH_TOPIC);
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
      getProjectRegionalQuota(projectId, orgId, publisher, messageIdFutures);
      getProjectVPCQuota(projectId, orgId, publisher, messageIdFutures);
      // getHiddenQuotas(projectId, orgId, publisher, messageIdFutures);
    } catch (IOException e) {
      logger.log(Level.SEVERE, "Error publishing Pub/Sub message: " + e.getMessage(), e);
    } finally {
      // Wait on any pending publish requests.
      List<String> messageIds = ApiFutures.allAsList(messageIdFutures).get();
      logger.info(
          "Published quota messages with batch settings for project Id: "
              + projectId
              + " to topic: "
              + topicName);
      if (publisher != null) {
        // When finished with the publisher, shutdown to free up resources.
        publisher.shutdown();
        publisher.awaitTermination(1, TimeUnit.MINUTES);
      }
    }
  }

  /*
   * API to get Project VPC quotas
   * */
  private static void getProjectVPCQuota(
      String projectId, String orgId, Publisher publisher, List<ApiFuture<String>> messageIdFutures)
      throws IOException {
    NetworkClient networkClient = NetworkClient.create();
    List<Network> projectNetworks =
        networkClient.listNetworks(projectId).getPage().getResponse().getItemsList();
    if (projectNetworks == null) return;
    for (Network network : projectNetworks) {
      addMessagetoPublish(
          publisher,
          messageIdFutures,
          ScanProjectHelper.buildVPCQuotaRowJson(network, orgId, projectId));
      addMessagetoPublish(
          publisher,
          messageIdFutures,
          ScanProjectHelper.buildSubnetQuotaRowJson(network, orgId, projectId));
    }
  }

  /*
   * API to get project regional quotas
   * */
  private static void getProjectRegionalQuota(
      String projectId, String orgId, Publisher publisher, List<ApiFuture<String>> messageIdFutures)
      throws IOException, InterruptedException {
    RegionClient regionClient = RegionClient.create();
    List<Region> regions =
        regionClient.listRegions(projectId).getPage().getResponse().getItemsList();
    for (Region region : regions) {
      List<Quota> quotas = region.getQuotasList();
      for (Quota quota : quotas) {
        String message =
            ScanProjectHelper.buildQuotaRowJson(quota, orgId, projectId, region.getName());
        ByteString data = ByteString.copyFromUtf8(message);
        PubsubMessage pubsubMessage = PubsubMessage.newBuilder().setData(data).build();
        // Once published, returns a server-assigned message id (unique within the topic)
        ApiFuture<String> messageIdFuture = publisher.publish(pubsubMessage);
        messageIdFutures.add(messageIdFuture);
      }
    }
  }

  /*
   * API to check if the current usage has reached the threshold
   * */
  public static void checkThreshold(Notification notification)
      throws IOException, InterruptedException {
    double thresholdF = Double.parseDouble("80");
    double consumptionF = notification.getConsumption();
    if ((Double.compare(consumptionF, thresholdF) >= 0)) {
      // @TODO uncomment this to enable email notification
      // sendNotification(notification);
    }
  }

  /*
   * API to add messages for batch publishing
   * */
  public static void addMessagetoPublish(
      Publisher publisher, List<ApiFuture<String>> messageIdFutures, String s) {
    String message = s;
    ByteString data = ByteString.copyFromUtf8(message);
    PubsubMessage pubsubMessage = PubsubMessage.newBuilder().setData(data).build();
    // Once published, returns a server-assigned message id (unique within the topic)
    ApiFuture<String> messageIdFuture = publisher.publish(pubsubMessage);
    messageIdFutures.add(messageIdFuture);
  }
}
