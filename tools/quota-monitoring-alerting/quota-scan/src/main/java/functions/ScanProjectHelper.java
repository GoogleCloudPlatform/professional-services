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
import com.google.api.services.cloudresourcemanager.CloudResourceManager;
import com.google.cloud.bigquery.BigQuery;
import com.google.cloud.bigquery.BigQueryError;
import com.google.cloud.bigquery.BigQueryException;
import com.google.cloud.bigquery.BigQueryOptions;
import com.google.cloud.bigquery.InsertAllRequest;
import com.google.cloud.bigquery.InsertAllResponse;
import com.google.cloud.bigquery.TableId;
import com.google.cloud.compute.v1.Network;
import com.google.cloud.compute.v1.NetworkClient;
import com.google.cloud.compute.v1.Quota;
import com.google.cloud.compute.v1.RegionClient;
import functions.eventpojos.GCPResourceClient;
import functions.eventpojos.ProjectQuota;
import java.io.IOException;
import java.security.GeneralSecurityException;
import java.util.Arrays;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.logging.Level;
import java.util.logging.Logger;

/*
* Helper class for ScanProject Cloud Function
* */
public class ScanProjectHelper {

  //Max VPC Peering Count
  private static final Integer MAX_VPC_PEERING_COUNT = 25;
  //Max VPC Sub Network Count
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
  * API to populate ProjectQuota POJO
  * */
  static ProjectQuota populateProjectQuota(Quota quota, Network network, String vpcSubnet, String orgId, String projectId, String regionId){
    ProjectQuota projectQuota = new ProjectQuota();
    projectQuota.setThreshold(Integer.valueOf(ScanProject.THRESHOLD));
    projectQuota.setOrgId(orgId);
    projectQuota.setProject(projectId);
    projectQuota.setTimestamp("AUTO");
    projectQuota.setFolderId("NA");
    projectQuota.setTargetPoolName("NA");
    if(quota != null){
      projectQuota.setRegion(regionId);
      double consumption = (quota.getUsage() / quota.getLimit()) * 100;
      projectQuota.setValue(String.valueOf(consumption));
      projectQuota.setMetric(quota.getMetric());
      projectQuota.setLimit(String.valueOf(quota.getLimit()));
      projectQuota.setUsage(String.valueOf(quota.getUsage()));
      projectQuota.setVpcName("NA");
    } else if(network != null){
      projectQuota.setRegion("global");
      projectQuota.setVpcName(network.getName());
      if(vpcSubnet.equals("vpc")){
        populateProjectVPCQuota(network, projectQuota);
      } else if(vpcSubnet.equals("subnet")){
        populateProjectSubnetworkQuota(network, projectQuota);
      }
    }
    return projectQuota;
  }

  /*
  * API to populate Project VPC Quota
  * */
  private static void populateProjectVPCQuota(Network network, ProjectQuota projectQuota) {
    int vpcPeeringCount = network.getPeeringsList() == null ? 0 : network.getPeeringsList().size();
    projectQuota.setMetric("VPC_PEERING");
    projectQuota.setLimit(String.valueOf(MAX_VPC_PEERING_COUNT));
    projectQuota.setUsage(String.valueOf(vpcPeeringCount));
    projectQuota.setValue(String.valueOf((vpcPeeringCount / MAX_VPC_PEERING_COUNT) * 100));
  }

  /*
  * API to populate subnetwork quotas
  * */
  private static void populateProjectSubnetworkQuota(Network network, ProjectQuota projectQuota) {
    int subNetworkCount = network.getSubnetworksList() == null ? 0 : network.getSubnetworksList().size();
    projectQuota.setMetric("SUBNET_PER_VPC");
    projectQuota.setLimit(String.valueOf(MAX_VPC_SUB_NETWORK_COUNT));
    projectQuota.setUsage(String.valueOf(subNetworkCount));
    projectQuota.setValue(String.valueOf((subNetworkCount / MAX_VPC_SUB_NETWORK_COUNT) * 100));
  }

  /*
  * API to build BigQuery row content from ProjectQuota object
  * */
  public static Map<String, Object> createBQRow(ProjectQuota projectQuota){
    Map<String, Object> rowContent = new HashMap<>();
    rowContent.put("threshold", projectQuota.getThreshold());
    rowContent.put("region", projectQuota.getRegion());
    rowContent.put("usage", projectQuota.getUsage());
    rowContent.put("limit", projectQuota.getLimit());
    rowContent.put("vpc_name", projectQuota.getVpcName());
    rowContent.put("metric", projectQuota.getMetric());
    rowContent.put("addedAt", projectQuota.getTimestamp());
    rowContent.put("project", projectQuota.getProject());
    rowContent.put("folder_id", projectQuota.getFolderId());
    rowContent.put("value", projectQuota.getValue());
    rowContent.put("targetpool_name", projectQuota.getTargetPoolName());
    rowContent.put("org_id", projectQuota.getOrgId());
    return rowContent;
  }

  /*
  * API to insert row in table
  * */
  public static void tableInsertRows(GCPResourceClient gcpResourceClient, Map<String, Object> rowContent) {

    try {
      // Initialize client that will be used to send requests. This client only needs to be created
      // once, and can be reused for multiple requests.
      BigQuery bigquery = gcpResourceClient.getBigQuery();
      // Get table
      TableId tableId = gcpResourceClient.getTableId();
      // Inserts rowContent into datasetName:tableId.
      InsertAllResponse response =
          bigquery.insertAll(
              InsertAllRequest.newBuilder(tableId)
                  .addRow(rowContent)
                  .build());

      if (response.hasErrors()) {
        // If any of the insertions failed, this lets you inspect the errors
        for (Map.Entry<Long, List<BigQueryError>> entry : response.getInsertErrors().entrySet()) {
          logger.info("Response error: \n" + entry.getValue());
        }
      }
      logger.info("Rows successfully inserted into table");
    } catch (BigQueryException e) {
      logger.info("Insert operation not performed \n" + e.toString());
    }
  }

  /*
  * API to create resource clients for BigQuery, Region and Network
  * This API also configures BigQuery table
  * */
  static GCPResourceClient createGCPResourceClient(){
      String datasetName = ScanProject.BIG_QUERY_DATASET;
      String tableName = ScanProject.BIG_QUERY_TABLE;
      // Initialize client that will be used to send requests. This client only needs to be created
      // once, and can be reused for multiple requests.
      BigQuery bigquery = BigQueryOptions.getDefaultInstance().getService();
      // Get table
      TableId tableId = TableId.of(datasetName, tableName);
      RegionClient regionClient = null;
      NetworkClient networkClient = null;
      try {
          regionClient = RegionClient.create();
          networkClient = NetworkClient.create();
      } catch (IOException e) {
          logger.log(Level.SEVERE,"Error creating client: ", e);
      }
      GCPResourceClient gcpResourceClient = new GCPResourceClient();
      gcpResourceClient.setBigQuery(bigquery);
      gcpResourceClient.setTableId(tableId);
      gcpResourceClient.setRegionClient(regionClient);
      gcpResourceClient.setNetworkClient(networkClient);
      return gcpResourceClient;
  }
}
