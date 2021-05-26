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

import com.google.api.client.googleapis.auth.oauth2.GoogleCredential;
import com.google.api.client.googleapis.javanet.GoogleNetHttpTransport;
import com.google.api.client.http.HttpTransport;
import com.google.api.client.json.JsonFactory;
import com.google.api.client.json.jackson2.JacksonFactory;
import com.google.api.core.ApiFuture;
import com.google.api.core.ApiFutureCallback;
import com.google.api.core.ApiFutures;
import com.google.api.services.cloudresourcemanager.CloudResourceManager;
import com.google.cloud.compute.v1.Network;
import com.google.cloud.compute.v1.Quota;
import com.google.cloud.pubsub.v1.Publisher;
import com.google.common.reflect.TypeToken;
import com.google.common.util.concurrent.MoreExecutors;
import com.google.gson.Gson;
import com.google.gson.GsonBuilder;
import com.google.protobuf.ByteString;
import com.google.pubsub.v1.PubsubMessage;
import functions.eventpojos.Notification;
import java.io.IOException;
import java.lang.reflect.Type;
import java.security.GeneralSecurityException;
import java.util.Arrays;
import java.util.HashMap;
import java.util.SortedMap;
import java.util.TreeMap;
import java.util.concurrent.TimeUnit;
import java.util.logging.Level;
import java.util.logging.Logger;

/*
 * Helper class for ScanProject Cloud Function
 * */
public class ScanProjectHelper {

  // Max VPC Peering Count
  private static final Integer MAX_VPC_PEERING_COUNT = 25;
  // Max VPC Sub Network Count
  private static final Integer MAX_VPC_SUB_NETWORK_COUNT = 100;

  private static final Logger logger = Logger.getLogger(ScanProjectHelper.class.getName());

  /*
   * API to get Cloud Resource Manager Service
   * */
  static CloudResourceManager createCloudResourceManagerService()
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

  /*
   * API to send notification
   * */
  public static void sendNotification(Notification notification)
      throws InterruptedException, IOException {
    GsonBuilder gb = new GsonBuilder();
    gb.serializeSpecialFloatingPointValues();
    Gson gson = gb.create();
    // Java object to JSON string
    String jsonInString = gson.toJson(notification);

    Publisher publisher = null;
    try {
      publisher = Publisher.newBuilder(ScanProject.NOTIFICATION_TOPIC).build();
      ByteString data = ByteString.copyFromUtf8(jsonInString);
      PubsubMessage pubsubMessage = PubsubMessage.newBuilder().setData(data).build();
      ApiFuture<String> messageIdFuture = publisher.publish(pubsubMessage);
      ApiFutures.addCallback(
          messageIdFuture,
          new ApiFutureCallback<String>() {
            public void onSuccess(String messageId) {
              logger.info("published notification with message id: " + messageId);
            }

            public void onFailure(Throwable t) {
              logger.log(Level.SEVERE, "Error publishing Pub/Sub message: " + t.getMessage(), t);
            }
          },
          MoreExecutors.directExecutor());
    } finally {
      if (publisher != null) {
        publisher.shutdown();
        publisher.awaitTermination(1, TimeUnit.MINUTES);
      }
    }
  }

  /*
   * Build Json for BigQuery row for default quotas
   *
   * */
  static String buildQuotaRowJson(Quota quota, String orgId, String projectId, String regionId)
      throws IOException, InterruptedException {
    SortedMap<String, String> elements = new TreeMap();
    double consumption = (quota.getUsage() / quota.getLimit()) * 100;
    elements.put("threshold", ScanProject.THRESHOLD);
    elements.put("org_id", orgId);
    elements.put("project", projectId);
    elements.put("region", regionId);
    elements.put("metric", quota.getMetric());
    elements.put("limit", String.valueOf(quota.getLimit()));
    elements.put("usage", String.valueOf(quota.getUsage()));
    elements.put("value", String.valueOf(consumption));
    elements.put("addedAt", "AUTO");
    elements.put("folder_id", "NA");
    elements.put("vpc_name", "NA");
    elements.put("targetpool_name", "NA");

    Gson gson = new Gson();
    Type gsonType = new TypeToken<HashMap>() {}.getType();
    String gsonString = gson.toJson(elements, gsonType);

    Notification notification = new Notification();
    notification.setConsumption(consumption);
    notification.setLimit(quota.getLimit());
    notification.setMetric(quota.getMetric());
    notification.setUsage(quota.getUsage());
    ScanProject.checkThreshold(notification);
    return gsonString;
  }

  /*
   * Build Json for BigQuery row of Subnet Quota
   * @TODO Reduce QuotaRowJson APIs to single API
   * */
  static String buildSubnetQuotaRowJson(Network network, String orgId, String projectId) {
    int vpcPeeringCount =
        network.getSubnetworksList() == null ? 0 : network.getSubnetworksList().size();
    SortedMap<String, String> elements = new TreeMap();
    elements.put("threshold", ScanProject.THRESHOLD);
    elements.put("org_id", orgId);
    elements.put("project", projectId);
    elements.put("region", "global");
    elements.put("metric", "SUBNET_PER_VPC");
    elements.put("limit", String.valueOf(MAX_VPC_SUB_NETWORK_COUNT));
    elements.put("usage", String.valueOf(vpcPeeringCount));
    elements.put("value", String.valueOf((vpcPeeringCount / MAX_VPC_SUB_NETWORK_COUNT) * 100));
    elements.put("addedAt", "AUTO");
    elements.put("folder_id", "NA");
    elements.put("vpc_name", network.getName());
    elements.put("targetpool_name", "NA");

    Gson gson = new Gson();
    Type gsonType = new TypeToken<HashMap>() {}.getType();
    String gsonString = gson.toJson(elements, gsonType);
    return gsonString;
  }

  /*
   * Build Json for BigQuery row of VPC Quota
   * */
  static String buildVPCQuotaRowJson(Network network, String orgId, String projectId) {
    int vpcPeeringCount = network.getPeeringsList() == null ? 0 : network.getPeeringsList().size();
    SortedMap<String, String> elements = new TreeMap();
    elements.put("threshold", ScanProject.THRESHOLD);
    elements.put("org_id", orgId);
    elements.put("project", projectId);
    elements.put("region", "global");
    elements.put("metric", "VPC_PEERING");
    elements.put("limit", String.valueOf(MAX_VPC_PEERING_COUNT));
    elements.put("usage", String.valueOf(vpcPeeringCount));
    elements.put("value", String.valueOf((vpcPeeringCount / MAX_VPC_PEERING_COUNT) * 100));
    elements.put("addedAt", "AUTO");
    elements.put("folder_id", "NA");
    elements.put("vpc_name", network.getName());
    elements.put("targetpool_name", "NA");

    Gson gson = new Gson();
    Type gsonType = new TypeToken<HashMap>() {}.getType();
    String gsonString = gson.toJson(elements, gsonType);
    return gsonString;
  }
}
