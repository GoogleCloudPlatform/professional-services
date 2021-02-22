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
import static org.mockito.Mockito.when;

import com.google.cloud.secretmanager.v1.AccessSecretVersionResponse;
import com.google.cloud.secretmanager.v1.SecretManagerServiceClient;
import com.google.cloud.secretmanager.v1.SecretPayload;
import com.google.protobuf.ByteString;
import java.io.IOException;
import java.io.StringReader;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.Properties;
import org.apache.commons.text.io.StringSubstitutorReader;
import org.junit.Before;
import org.junit.Test;
import org.junit.runner.RunWith;
import org.mockito.Mock;
import org.mockito.junit.MockitoJUnitRunner;

/**
 * Unit and integration tests for {@link
 * com.google.cloud.secrethelper.SecretManagerStringSubstitutor}.
 */
@RunWith(MockitoJUnitRunner.class)
public class SecretManagerSubstitutorPropertiesTest {

  static final String propertiesString =
      "" + "secret.file.path=${secretManagerToFilePath:%s}\n" + "secret.value=${secretManager:%s}";
  String secretValue = "hello world!";
  String secretName = "projects/685964841825/secrets/a-secret/versions/1";
  SecretManagerStringSubstitutor secretManagerStringSubstitutor;
  @Mock SecretManagerServiceClient client;
  @Mock AccessSecretVersionResponse response;
  @Mock SecretPayload payload;

  @Before
  public void setUp() {
    when(client.accessSecretVersion(secretName)).thenReturn(response);
    when(response.getPayload()).thenReturn(payload);
    when(payload.getData()).thenReturn(ByteString.copyFromUtf8(secretValue));
    secretManagerStringSubstitutor = new SecretManagerStringSubstitutor(client);
  }

  @Test
  public void testSecretManagerSubstitutorProperties() throws IOException {
    String template = String.format(propertiesString, secretName, secretName);
    StringReader stringReader = new StringReader(template);
    Properties properties = new Properties();
    properties.load(new StringSubstitutorReader(stringReader, secretManagerStringSubstitutor));

    Path path = Paths.get(properties.getProperty("secret.file.path"));
    String secretFilePathValue = new String(Files.readAllBytes(path));
    assertEquals(secretFilePathValue, secretValue);

    String secretStringValue = properties.getProperty("secret.value");
    assertEquals(secretStringValue, secretValue);
  }
}
