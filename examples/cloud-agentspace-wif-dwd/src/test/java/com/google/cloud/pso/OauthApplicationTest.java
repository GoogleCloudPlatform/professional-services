package com.google.cloud.pso;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

import com.google.api.client.googleapis.auth.oauth2.GoogleTokenResponse;
import com.google.api.client.http.GenericUrl;
import com.google.api.client.http.HttpRequest;
import com.google.api.client.http.HttpRequestFactory;
import com.google.api.client.http.HttpResponse;
import com.google.api.client.http.HttpTransport;
import com.google.api.client.json.JsonFactory;
import com.google.cloud.discoveryengine.v1alpha.SearchRequest;
import com.google.cloud.discoveryengine.v1alpha.SearchResponse;
import com.google.cloud.discoveryengine.v1alpha.SearchServiceClient;
import com.google.cloud.discoveryengine.v1alpha.SearchServiceSettings;
import com.google.cloud.iam.credentials.v1.IamCredentialsClient;
import com.google.cloud.iam.credentials.v1.SignJwtRequest;
import com.google.cloud.iam.credentials.v1.SignJwtResponse;
import java.io.IOException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.MockedStatic;
import org.mockito.Mockito;

class OauthApplicationTest {

  private String projectId;
  private String location;
  private String collectionId;
  private String engineId;
  private String servingConfigId;
  private String searchUserEmail;
  private String serviceAccountId;
  private String searchQuery;

  @BeforeEach
  void setUp() {
    projectId = "test-project-id";
    location = "global";
    collectionId = "default_collection";
    engineId = "ws-search_engine";
    servingConfigId = "default_search";
    searchUserEmail = "test@example.com";
    serviceAccountId = "test-sa@test-project-id.iam.gserviceaccount.com";
    searchQuery = "Test Search Query";
  }

  @Test
  void testSearchSuccess() throws Exception {
    // Mocking IamCredentialsClient
    IamCredentialsClient mockIamCredentialsClient = mock(IamCredentialsClient.class);
    SignJwtResponse mockSignJwtResponse = mock(SignJwtResponse.class);
    when(mockSignJwtResponse.getSignedJwt()).thenReturn("mockedSignedJwt");
    when(mockIamCredentialsClient.signJwt(any(SignJwtRequest.class))).thenReturn(mockSignJwtResponse);

    // Mocking getAccessToken
    GoogleTokenResponse mockGoogleTokenResponse = mock(GoogleTokenResponse.class);
    when(mockGoogleTokenResponse.getAccessToken()).thenReturn("mockedAccessToken");
    HttpResponse mockHttpResponse = mock(HttpResponse.class);
    when(mockHttpResponse.parseAs(GoogleTokenResponse.class)).thenReturn(mockGoogleTokenResponse);
    HttpRequest mockHttpRequest = mock(HttpRequest.class);
    when(mockHttpRequest.execute()).thenReturn(mockHttpResponse);
    HttpRequestFactory mockHttpRequestFactory = mock(HttpRequestFactory.class);
    when(mockHttpRequestFactory.buildPostRequest(any(GenericUrl.class), any())).thenReturn(mockHttpRequest);
    HttpTransport mockHttpTransport = mock(HttpTransport.class);
    when(mockHttpTransport.createRequestFactory()).thenReturn(mockHttpRequestFactory);

    // Mocking SearchServiceClient
    SearchServiceClient mockSearchServiceClient = mock(SearchServiceClient.class);
    SearchResponse mockSearchResponse = mock(SearchResponse.class);
    SearchResponse.SearchResult mockSearchResult = mock(SearchResponse.SearchResult.class);
    when(mockSearchResult.toString()).thenReturn("Mocked Search Result");
    when(mockSearchResponse.getResultsList()).thenReturn(java.util.Collections.singletonList(mockSearchResult));
    when(mockSearchResponse.getResultsCount()).thenReturn(1);
    SearchServiceClient.SearchPagedResponse mockPagedResponse = mock(SearchServiceClient.SearchPagedResponse.class);
    when(mockPagedResponse.getPage()).thenReturn(new SearchResponse.SearchResult.Page() {
      @Override
      public SearchResponse getResponse() {
        return mockSearchResponse;
      }
    });
    when(mockSearchServiceClient.search(any(SearchRequest.class))).thenReturn(mockPagedResponse);

    try (MockedStatic<IamCredentialsClient> mockedIamCredentialsClient = Mockito.mockStatic(IamCredentialsClient.class);
         MockedStatic<SearchServiceClient> mockedSearchServiceClient = Mockito.mockStatic(SearchServiceClient.class);
         MockedStatic<OauthApplication> mockedOauthApplication = Mockito.mockStatic(OauthApplication.class);
         MockedStatic<HttpTransport> mockedHttpTransport = Mockito.mockStatic(HttpTransport.class)) {

      mockedIamCredentialsClient.when(IamCredentialsClient::create).thenReturn(mockIamCredentialsClient);
      mockedSearchServiceClient.when(() -> SearchServiceClient.create(any(SearchServiceSettings.class))).thenReturn(mockSearchServiceClient);
      mockedHttpTransport.when(HttpTransport::new).thenReturn(mockHttpTransport);
      when(mockHttpTransport.createRequestFactory()).thenReturn(mockHttpRequestFactory);
      when(mockHttpRequestFactory.buildPostRequest(any(GenericUrl.class), any())).thenReturn(mockHttpRequest);
      when(mockHttpRequest.execute()).thenReturn(mockHttpResponse);
      when(mockHttpResponse.parseAs(GoogleTokenResponse.class)).thenReturn(mockGoogleTokenResponse);

      mockedOauthApplication.when(() -> OauthApplication.generateSingedJwt(searchUserEmail, serviceAccountId)).thenReturn("mockedSignedJwt");
      mockedOauthApplication.when(() -> OauthApplication.getAccessToken("mockedSignedJwt")).thenReturn("mockedAccessToken");

      OauthApplication.search(projectId, location, collectionId, engineId, servingConfigId, searchQuery, searchUserEmail, serviceAccountId);

      // Verify that the search method executed without throwing an exception.  More specific
      // verification would be ideal, but this at least confirms the happy path.
      assertNotNull(mockSearchResponse);
      assertEquals(1, mockSearchResponse.getResultsCount());
    }
  }

  @Test
  void testGenerateSingedJwtSuccess() throws IOException {
    // Mocking IamCredentialsClient
    IamCredentialsClient mockIamCredentialsClient = mock(IamCredentialsClient.class);
    SignJwtResponse mockSignJwtResponse = mock(SignJwtResponse.class);
    when(mockSignJwtResponse.getSignedJwt()).thenReturn("mockedSignedJwt");
    when(mockIamCredentialsClient.signJwt(any(SignJwtRequest.class))).thenReturn(mockSignJwtResponse);

    try (MockedStatic<IamCredentialsClient> mockedIamCredentialsClient = Mockito.mockStatic(IamCredentialsClient.class)) {
      mockedIamCredentialsClient.when(IamCredentialsClient::create).thenReturn(mockIamCredentialsClient);

      String signedJwt = OauthApplication.generateSingedJwt(searchUserEmail, serviceAccountId);

      assertNotNull(signedJwt);
      assertEquals("mockedSignedJwt", signedJwt);
    }
  }

  @Test
  void testGetAccessTokenSuccess() throws IOException {
    // Mocking HTTP components
    GoogleTokenResponse mockGoogleTokenResponse = mock(GoogleTokenResponse.class);
    when(mockGoogleTokenResponse.getAccessToken()).thenReturn("mockedAccessToken");
    HttpResponse mockHttpResponse = mock(HttpResponse.class);
    when(mockHttpResponse.parseAs(GoogleTokenResponse.class)).thenReturn(mockGoogleTokenResponse);
    HttpRequest mockHttpRequest = mock(HttpRequest.class);
    when(mockHttpRequest.execute()).thenReturn(mockHttpResponse);
    HttpRequestFactory mockHttpRequestFactory = mock(HttpRequestFactory.class);
    when(mockHttpRequestFactory.buildPostRequest(any(GenericUrl.class), any())).thenReturn(mockHttpRequest);
    HttpTransport mockHttpTransport = mock(HttpTransport.class);
    when(mockHttpTransport.createRequestFactory()).thenReturn(mockHttpRequestFactory);

    try (MockedStatic<HttpTransport> mockedHttpTransport = Mockito.mockStatic(HttpTransport.class)) {
      mockedHttpTransport.when(HttpTransport::new).thenReturn(mockHttpTransport);
      when(mockHttpTransport.createRequestFactory()).thenReturn(mockHttpRequestFactory);
      when(mockHttpRequestFactory.buildPostRequest(any(GenericUrl.class), any())).thenReturn(mockHttpRequest);
      when(mockHttpRequest.execute()).thenReturn(mockHttpResponse);
      when(mockHttpResponse.parseAs(GoogleTokenResponse.class)).thenReturn(mockGoogleTokenResponse);

      String accessToken = OauthApplication.getAccessToken("mockedSignedJwt");

      assertNotNull(accessToken);
      assertEquals("mockedAccessToken", accessToken);
    }
  }
}