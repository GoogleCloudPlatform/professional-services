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

import static functions.ScanProjectHelper.createBQRow;
import static functions.ScanProjectHelper.populateProjectQuota;
import static functions.ScanProjectHelper.tableInsertRows;

import com.google.api.services.cloudresourcemanager.CloudResourceManager;
import com.google.api.services.cloudresourcemanager.model.Ancestor;
import com.google.api.services.cloudresourcemanager.model.GetAncestryRequest;
import com.google.api.services.cloudresourcemanager.model.GetAncestryResponse;
import com.google.cloud.compute.v1.Network;
import com.google.cloud.compute.v1.NetworkClient;
import com.google.cloud.compute.v1.Quota;
import com.google.cloud.compute.v1.Region;
import com.google.cloud.compute.v1.RegionClient;
import com.google.cloud.functions.BackgroundFunction;
import com.google.cloud.functions.Context;
import functions.eventpojos.GCPResourceClient;
import functions.eventpojos.ProjectQuota;
import functions.eventpojos.PubSubMessage;
import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.security.GeneralSecurityException;
import java.util.Base64;
import java.util.Iterator;
import java.util.List;
import java.util.Map;
import java.util.logging.Level;
import java.util.logging.Logger;

/*
* The ScanProject Cloud Function Scan project Quotas for a given project Id.
* The background cloud function is triggered by Pub/Sub topic
* */
public class ScanProject implements BackgroundFunction<PubSubMessage> {
    //Cloud Function Environment variable for Threshold
    public static final String THRESHOLD = System.getenv("THRESHOLD");
    //BigQuery Dataset name
    public static final String BIG_QUERY_DATASET = System.getenv("BIG_QUERY_DATASET");
    //BigQuery Table name
    public static final String BIG_QUERY_TABLE = System.getenv("BIG_QUERY_TABLE");

    private static final Logger logger = Logger.getLogger(ScanProject.class.getName());

    /*
    * API to accept request to Cloud Function
    * */
    @Override
    public void accept(PubSubMessage message, Context context) {
        if (message.getData() == null) {
            logger.info("No Project Id provided");
            return;
        }
        //project Id received from Pub/Sub topic
        String projectId = new String(
                Base64.getDecoder().decode(message.getData().getBytes(StandardCharsets.UTF_8)),
                StandardCharsets.UTF_8);
        try {
            CloudResourceManager cloudResourceManagerService = ScanProjectHelper
                .createCloudResourceManagerService();
            // Fetch Org id of the project
            String orgId = getOrgId(cloudResourceManagerService, projectId);
            logger.info("Starting scanning for ProjectId: " + projectId);
            //Get GCP Service's clients
            GCPResourceClient gcpResourceClient = ScanProjectHelper.createGCPResourceClient();
            //Get project quota
            getProjectRegionalQuota(gcpResourceClient, projectId, orgId);
            getProjectVPCQuota(gcpResourceClient, projectId, orgId);
        } catch (IOException | GeneralSecurityException e) {
            logger.log(Level.SEVERE, "Error publishing Pub/Sub message: " + e.getMessage(), e);
        }
        logger.info("Successfully scanned quota for ProjectId: " + projectId);
    }

    /*
    * API to fetch the project's regional quotas.
    * Project regional quotas include compute quotas
    * */
    private static void getProjectRegionalQuota(GCPResourceClient gcpResourceClient, String projectId, String orgId) throws IOException {
        RegionClient regionClient = gcpResourceClient.getRegionClient();
        try{
            List<Region> regions = regionClient.listRegions(projectId).getPage().getResponse().getItemsList();
            for(Region region : regions){
                List<Quota> quotas = region.getQuotasList();
                for(Quota quota : quotas){
                    loadBigQuery(gcpResourceClient, quota,null,null,orgId,projectId,region.getId());
                }
            }
        }catch (Exception e){
            logger.log(Level.SEVERE,"Exception while scanning regional quota: " + projectId, e);
        }

    }

    /*
    * API to fetch the project's VPC quota.
    * */
    private static void getProjectVPCQuota(GCPResourceClient gcpResourceClient, String projectId, String orgId) throws IOException {
        NetworkClient networkClient = gcpResourceClient.getNetworkClient();
        List<Network> projectNetworks = networkClient.listNetworks(projectId).getPage().getResponse().getItemsList();
        if(projectNetworks == null)
            return;
        for(Network network : projectNetworks){
            loadBigQuery(gcpResourceClient, null,network,"vpc",orgId,projectId,null);
            loadBigQuery(gcpResourceClient,null,network,"subnet",orgId,projectId,null);
        }
    }

    /*
    * API to load quotas in BigQuery table
    * */
    private static void loadBigQuery(GCPResourceClient gcpResourceClient, Quota quota, Network network, String vpcSubnet, String orgId, String projectId, String regionId){
        ProjectQuota projectQuota = populateProjectQuota(quota,network,vpcSubnet,orgId,projectId,regionId);
        Map<String, Object> row = createBQRow(projectQuota);
        tableInsertRows(gcpResourceClient,row);
    }

    /*
    * API to get Organization Id for project Id
    * */
    private static String getOrgId(CloudResourceManager cloudResourceManagerService, String projectId) throws IOException, GeneralSecurityException {
        GetAncestryRequest requestBody = new GetAncestryRequest();

        CloudResourceManager.Projects.GetAncestry request =
                cloudResourceManagerService.projects().getAncestry(projectId, requestBody);

        GetAncestryResponse response = request.execute();
        Iterator<Ancestor> ancestorIterator =response.getAncestor().iterator();
        while ((ancestorIterator.hasNext())){
            Ancestor ancestor = ancestorIterator.next();
            if(ancestor.getResourceId().getType().equals("organization"))
                return ancestor.getResourceId().getId();
        }
        return null;
    }

}