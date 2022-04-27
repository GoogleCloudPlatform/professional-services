/*
Copyright 2022 Google LLC

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

    https://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
*/

package com.google.cloud.pso.security.asset;

import com.google.cloud.asset.v1.AssetServiceClient;
import com.google.cloud.asset.v1.AssetServiceClient.SearchAllIamPoliciesPagedResponse;
import com.google.cloud.asset.v1.IamPolicySearchResult;
import com.google.cloud.asset.v1.SearchAllIamPoliciesRequest;
import com.google.cloud.asset.v1.SearchAllIamPoliciesRequest.Builder;
import com.google.cloud.pso.security.constants.GenericConstants;
import com.google.common.flogger.GoogleLogger;
import com.google.iam.v1.Binding;
import com.google.iam.v1.Policy;
import java.io.FileWriter;
import java.io.IOException;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.HashSet;
import java.util.Iterator;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.concurrent.TimeUnit;

/** Search all IAM policies, manipulate then and print the result. */
public class AssetServiceUtil {
  private static final GoogleLogger logger = GoogleLogger.forEnclosingClass();
  private static AssetServiceClient client = null;

  /**
   * Create the AssetServiceClient
   *
   * @return
   * @throws IOException
   */
  private AssetServiceClient createAssetServiceClient() throws IOException {
    logger.atInfo().log("Creating AssetServiceClient.");
    if (client == null) {
      client = AssetServiceClient.create();
    }
    return client;
  }

  /**
   * Create only one instance of AssetServiceClient
   *
   * @return
   * @throws IOException
   */
  public AssetServiceClient getAssetServiceClient() throws IOException {
    logger.atInfo().log("Get AssetServiceClient.");
    if (client == null) {
      client = createAssetServiceClient();
    }
    return client;
  }

  /**
   * Utility method to get everything together.
   *
   * @param scope
   * @param query
   * @throws IOException
   * @throws InterruptedException
   */
  public void analyzeBindings(String scope, String query) throws IOException, InterruptedException {
    logger.atInfo().log("Analysing bindings");
    List<IamPolicySearchResult> iamPolicySearchResults = null;
    try {
      iamPolicySearchResults = searchAllIamPolicies(scope, query);
      Map<String, Set<Map<String, List<String>>>> map =
          convertPolicyToRoleMap(iamPolicySearchResults);
      printResults(map);
    } catch (IOException e) {
      logger.atSevere().log("Unable to process bindings for the roles.");
      throw e;
    }
  }

  /**
   * Searches for all the iam policies within the given scope.
   *
   * @param scope
   * @param query
   * @return IamPolicySearchResult
   * @throws IOException
   * @throws InterruptedException
   */
  public List<IamPolicySearchResult> searchAllIamPolicies(String scope, String query)
      throws IOException, InterruptedException {

    logger.atInfo().log("Searching all IAM policies.");

    List<IamPolicySearchResult> iamPolicySearchResults = new ArrayList<IamPolicySearchResult>();

    int pageSize = 0;
    String pageToken = "";

    Builder builder =
        SearchAllIamPoliciesRequest.newBuilder()
            .setScope(scope)
            .setQuery(query)
            .setPageSize(pageSize)
            .setPageToken(pageToken);

    SearchAllIamPoliciesRequest request = builder.build();

    AssetServiceClient client = getAssetServiceClient();
    SearchAllIamPoliciesPagedResponse response = null;
    do {
      response = client.searchAllIamPolicies(request);
      Iterable<IamPolicySearchResult> iterable = response.iterateAll();
      Iterator<IamPolicySearchResult> iterator = iterable.iterator();
      while (iterator.hasNext()) {
        IamPolicySearchResult iamPolicySearchResult = iterator.next();
        iamPolicySearchResults.add(iamPolicySearchResult);
      }
      builder =
          SearchAllIamPoliciesRequest.newBuilder()
              .setScope(scope)
              .setQuery(query)
              .setPageSize(pageSize)
              .setPageToken(response.getNextPageToken());
      request = builder.build();
      /*
       * To avoid below error around quota adding sleep. Quota limits are mentioned at:
       * https://cloud.google.com/asset-inventory/docs/quota
       * RESOURCE_EXHAUSTED: Quota exceeded for quota metric 'SearchAllIamPolicies
       * Requests' and limit 'SearchAllIamPolicies Requests per minute' of service
       * 'cloudasset.googleapis.com' for consumer project
       */
      TimeUnit.SECONDS.sleep(1);
    } while (!response.getNextPageToken().equals(""));
    return iamPolicySearchResults;
  }

  /**
   * Convert IAM policy serach results to role resource binding map.
   *
   * @param iamPolicySearchResults
   * @return - role resource binding map
   */
  public Map<String, Set<Map<String, List<String>>>> convertPolicyToRoleMap(
      List<IamPolicySearchResult> iamPolicySearchResults) {

    logger.atInfo().log("Converting IAM policies to role resource binding map.");

    Map<String, Set<Map<String, List<String>>>> map =
        new HashMap<String, Set<Map<String, List<String>>>>();

    Iterator<IamPolicySearchResult> iterator = iamPolicySearchResults.iterator();
    while (iterator.hasNext()) {
      IamPolicySearchResult iamPolicySearchResult = iterator.next();
      String resouce = iamPolicySearchResult.getResource();
      Policy policy = iamPolicySearchResult.getPolicy();
      List<Binding> list = policy.getBindingsList();

      String role = "";
      List<String> members = null;

      Iterator<Binding> iteratorBinding = list.iterator();
      while (iteratorBinding.hasNext()) {
        Binding binding = iteratorBinding.next();
        role = binding.getRole();

        members = new ArrayList<String>(binding.getMembersList());

        Map<String, List<String>> resourceToMembersMap = new HashMap<String, List<String>>();
        resourceToMembersMap.put(resouce, members);
        Set<Map<String, List<String>>> existingResourceToMembersMapList = map.get(role);
        if (existingResourceToMembersMapList != null) {
          existingResourceToMembersMapList.add(resourceToMembersMap);
        } else {
          Set<Map<String, List<String>>> resourceToMembersMapList =
              new HashSet<Map<String, List<String>>>();
          resourceToMembersMapList.add(resourceToMembersMap);
          map.put(role, resourceToMembersMapList);
        }
      }
    }
    return map;
  }

  /**
   * Prints results to the file in csv format.
   *
   * @param resultMap - role resource binding map
   * @throws IOException
   */
  public void printResults(Map<String, Set<Map<String, List<String>>>> resultMap)
      throws IOException {

    FileWriter resultsFile = null;

    String resultFileName =
        GenericConstants.RESULT_FILENAME_ROLE_BINDING + "." + GenericConstants.DEFAULT_FORMAT;
    logger.atInfo().log("Writing results to file: " + resultFileName);
    try {
      resultsFile = new FileWriter(resultFileName);
    } catch (IOException e) {
      logger.atSevere().log("Exception while writing results to the file: " + resultFileName);
      throw e;
    }
    StringBuffer headers = new StringBuffer();
    headers.append(GenericConstants.COLUMN_ROLE + ",");
    headers.append(GenericConstants.COLUMN_RESOURCE + ",");
    headers.append(GenericConstants.COLUMN_BINDINGS + "\n");
    resultsFile.append(headers);

    String role = "";
    for (Iterator<Map.Entry<String, Set<Map<String, List<String>>>>> it =
            resultMap.entrySet().iterator();
        it.hasNext(); ) {

      Map.Entry<String, Set<Map<String, List<String>>>> entry = it.next();
      role = entry.getKey();
      Set<Map<String, List<String>>> resourceToMemberMapList = entry.getValue();
      Iterator<Map<String, List<String>>> iterator = resourceToMemberMapList.iterator();
      while (iterator.hasNext()) {
        Map<String, List<String>> resouceToBindingMap = iterator.next();
        for (Iterator<Map.Entry<String, List<String>>> it1Iterator =
                resouceToBindingMap.entrySet().iterator();
            it1Iterator.hasNext(); ) {
          Map.Entry<String, List<String>> entry1Entry = it1Iterator.next();
          String resouce = entry1Entry.getKey();
          List<String> bindingsList = entry1Entry.getValue();
          Iterator<String> iterator2 = bindingsList.iterator();
          StringBuffer bindiStringBuffer = new StringBuffer();
          while (iterator2.hasNext()) {
            bindiStringBuffer.append(iterator2.next() + " ");
          }
          resultsFile.append(role + ", " + resouce + ", " + bindiStringBuffer + "\n");
        }
      }
    }
    resultsFile.close();
  }
}
