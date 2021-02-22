/*
 * Copyright 2021 Google LLC
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

package com.google.cloud.secrethelper;

import static org.junit.Assert.assertEquals;
import static org.junit.Assert.assertNotSame;
import static org.mockito.Mockito.when;

import com.google.cloud.secretmanager.v1.AccessSecretVersionResponse;
import com.google.cloud.secretmanager.v1.SecretManagerServiceClient;
import com.google.cloud.secretmanager.v1.SecretPayload;
import com.google.protobuf.ByteString;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Paths;
import org.junit.Before;
import org.junit.Test;
import org.junit.runner.RunWith;
import org.mockito.Mock;
import org.mockito.junit.MockitoJUnitRunner;

/** Unit and integration tests for {@link com.google.cloud.secrethelper.SecretLookupToFile}. */
@RunWith(MockitoJUnitRunner.class)
public class SecretLookupToFileTest {

  String secretValue = "hello world!";
  String secretName = "projects/685964841825/secrets/a-secret/versions/1";

  @Mock SecretManagerServiceClient client;
  @Mock AccessSecretVersionResponse response;
  @Mock SecretPayload payload;

  @Before
  public void setUp() {
    when(client.accessSecretVersion(secretName)).thenReturn(response);
    when(response.getPayload()).thenReturn(payload);
    when(payload.getData()).thenReturn(ByteString.copyFromUtf8(secretValue));
  }

  @Test
  public void testSecretLookup() throws IOException {
    SecretLookupToFile secretLookupToFile = new SecretLookupToFile(client);
    String path = secretLookupToFile.lookup(secretName);
    byte[] arr = Files.readAllBytes(Paths.get(path));
    Files.delete(Paths.get(path));
    assertEquals(new String(arr), secretValue);
  }

  @Test
  public void testSecretLookupFails() {
    SecretLookupToFile secretLookupToFile = new SecretLookupToFile(client);
    String lookupValue = secretLookupToFile.lookup(secretName);
    assertNotSame(lookupValue, secretValue);
  }
}
