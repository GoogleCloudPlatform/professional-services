/**
 * 
 *  Copyright 2025 Google LLC

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
package com.google.cloud.pso;


import com.google.api.client.googleapis.auth.oauth2.GoogleTokenResponse;
import com.google.api.client.http.*;
import com.google.api.client.http.javanet.NetHttpTransport;
import com.google.api.client.json.JsonFactory;
import com.google.api.client.json.JsonObjectParser;
import com.google.api.client.json.gson.GsonFactory;
import com.google.api.gax.core.FixedCredentialsProvider;
import com.google.auth.Credentials;
import com.google.auth.http.HttpCredentialsAdapter;
import com.google.auth.oauth2.AccessToken;
import com.google.auth.oauth2.OAuth2Credentials;
import com.google.cloud.discoveryengine.v1alpha.*;
import com.google.cloud.iam.credentials.v1.IamCredentialsClient;
import com.google.cloud.iam.credentials.v1.SignJwtRequest;
import com.google.cloud.iam.credentials.v1.SignJwtResponse;

import java.io.IOException;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.Map;
import java.util.concurrent.ExecutionException;

/**
 * This sample demonstrates how to authenticate GCP AgentSapce and discovery API using Domain
 * Wide Delegation to impersonate the user
 * when using WIF credentials
 */
public class OauthApplication {

  public static void main(String[] args) {

    /*
     * Configuration details
     * 
     */

    String projectId = "project-id"; // Project ID .
    String location = "global"; // Location of data store. Options: "global", "us", "eu"
    String collectionId = "default_collection"; // Collection containing the data store.
    String engineId = "ws-search_engine"; // Engine ID.
    String servingConfigId = "default_search"; // Serving configuration. Options: "default_search"
    String searchUserEmail = "email@domain.com"; // Email-id of the user to impersonate
    String serviceAccountId = "service-account@projectid.iam.gserviceaccount.com"; // Service account with the permission on the WIF

    String searchQuery = "Sample Search Query"; // Search Query for the data store.
    try {
      search(projectId, location, collectionId, engineId, servingConfigId, searchQuery,
          searchUserEmail, serviceAccountId);
    } catch (IOException | ExecutionException e) {
      throw new RuntimeException(e);
    }
  }

  /**
   * Performs a search operation in the Google Cloud Discovery Engine.
   *
   * @param projectId       The project ID.
   * @param location        The location of the data store.
   * @param collectionId    The collection containing the data store.
   * @param engineId        The engine ID.
   * @param servingConfigId The serving configuration ID.
   * @param searchQuery     The search query.
   * @param searchUserEmail The email of the user to impersonate.
   * @param serviceAccount  The service account with the necessary permissions,
   *                        should be same one from credentials.
   * @throws IOException        If an I/O error occurs.
   * @throws ExecutionException If an execution error occurs.
   */
  public static void search(
      String projectId,
      String location,
      String collectionId,
      String engineId,
      String servingConfigId,
      String searchQuery,
      String searchUserEmail,
      String serviceAccount)
      throws IOException, ExecutionException {

    SearchServiceSettings settings = null;
    try {
      Credentials credentials = generateCredentials(searchUserEmail, serviceAccount);
      HttpRequestInitializer requestInitializer = new HttpCredentialsAdapter(credentials);
      HttpTransport transport = new NetHttpTransport.Builder().build();
      transport.createRequestFactory(requestInitializer);
      settings = SearchServiceSettings.newBuilder()
          .setCredentialsProvider(FixedCredentialsProvider.create(credentials))
          .build();
      SearchServiceClient searchServiceClient = SearchServiceClient.create(settings);
      SearchRequest request = SearchRequest.newBuilder()
          .setServingConfig(
              ServingConfigName.formatProjectLocationCollectionEngineServingConfigName(
                  projectId, location, collectionId, engineId, servingConfigId))
          .setQuery(searchQuery)
          .setPageSize(10)
          .build();
      Object o = searchServiceClient.search(request).getPage().getResponse();
      System.out.println("Response Object: " + o);
      SearchResponse response = searchServiceClient.search(request).getPage().getResponse();
      for (SearchResponse.SearchResult element : response.getResultsList()) {
        System.out.println("Response content: " + element);
      }
      System.out.println("Response size: " + response.getResultsCount());
    } catch (Exception e) {
      System.out.println("Error occurred while searching");
      e.printStackTrace();
    }
  }

  /**
   * Generates credentials for a given user email and service account.
   *
   * @param userEmail        The email of the user.
   * @param serviceAccountId The service account ID.
   * @return A Credentials object containing the OAuth2 credentials.
   * @throws IOException If an I/O error occurs during credentials generation.
   */
  private static Credentials generateCredentials(String userEmail, String serviceAccountId)
      throws IOException {
    String signedJWT = generateSingedJwt(userEmail, serviceAccountId);
    String accessTokenStr = getAccessToken(signedJWT);
    AccessToken accessToken = AccessToken.newBuilder().setTokenValue(accessTokenStr).build();
    OAuth2Credentials oAuth2Credentials = OAuth2Credentials.create(accessToken);
    return oAuth2Credentials;
  }

  /**
   * Exchanges a signed JWT for an access token from Google OAuth2.
   *
   * @param signedJWT The signed JWT.
   * @return The access token.
   * @throws IOException If an I/O error occurs during the token exchange.
   */
  private static String getAccessToken(String signedJWT) throws IOException {
    Map<String, String> requestBody = new HashMap<>();
    // Prepare the request body for the token exchange
    requestBody.put("grant_type", "assertion");
    requestBody.put("assertion_type", "http://oauth.net/grant_type/jwt/1.0/bearer");
    requestBody.put("assertion", signedJWT);

    NetHttpTransport httpTransport = new NetHttpTransport();
    HttpRequestFactory requestFactory = httpTransport.createRequestFactory();
    GenericUrl url = new GenericUrl("https://oauth2.googleapis.com/token");
    HttpContent content = new UrlEncodedContent(requestBody);
    HttpRequest tokenRequest = requestFactory.buildPostRequest(url, content);
    JsonFactory jsonFactory = new GsonFactory();
    JsonObjectParser parser = new JsonObjectParser(jsonFactory);
    tokenRequest.setParser(parser);

    HttpResponse tokenResponse = tokenRequest.execute();
    GoogleTokenResponse googleTokenResponse = tokenResponse.parseAs(GoogleTokenResponse.class);
    return googleTokenResponse.getAccessToken();

  }

  /**
   * Generates a signed JWT for a given user email and service account using
   * Google IAM Credentials API.
   *
   * @param userEmail        The email of the user.
   * @param serviceAccountId The service account ID.
   * @return The signed JWT.
   * @throws IOException If an I/O error occurs during JWT generation.
   */
  private static String generateSingedJwt(String userEmail, String serviceAccountId)
      throws IOException {
    IamCredentialsClient iamCredentialsClient = IamCredentialsClient.create();
    long nowSeconds = System.currentTimeMillis() / 1000;
    long expSeconds = nowSeconds + 1800; // 30 minutes

    String jsonPayload = "{\"aud\":\"https://oauth2.googleapis.com/token\""
        + ",\"exp\":" + expSeconds
        + ",\"iat\":" + nowSeconds
        + ",\"iss\":\"" + serviceAccountId + "\""
        + ",\"sub\":\"" + userEmail + "\""
        + ",\"scope\":\"https://www.googleapis.com/auth/cloud-platform\"}";
    System.out.println(jsonPayload);

    SignJwtRequest request = SignJwtRequest.newBuilder()
        .setName("projects/-/serviceAccounts/" + serviceAccountId)
        .addAllDelegates(new ArrayList<String>())
        .setPayload(jsonPayload)
        .build();

    SignJwtResponse response = iamCredentialsClient.signJwt(request);
    System.out.println("response: " + response);

    return response.getSignedJwt();
  }
}
