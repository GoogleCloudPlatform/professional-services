/*
 * Copyright 2025 Google LLC
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

import com.google.cloud.secretmanager.v1.AccessSecretVersionResponse;
import com.google.cloud.secretmanager.v1.SecretManagerServiceClient;
import com.google.protobuf.ByteString;
import java.io.IOException;
import org.apache.commons.text.lookup.StringLookup;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

/**
 * Implements {@link org.apache.commons.text.lookup.StringLookup}. {@link
 * com.google.cloud.secrethelper.SecretLookup#lookup} looks up a key in Secret Manager and returns
 * the secret payload.
 */
public class SecretLookup implements StringLookup {

  private static final Logger LOG = LoggerFactory.getLogger(SecretLookup.class);
  private final SecretManagerServiceClient client;

  public SecretLookup(SecretManagerServiceClient client) {
    this.client = client;
  }

  public SecretLookup() throws IOException {
    this.client = SecretManagerServiceClient.create();
  }

  @Override
  public String lookup(String key) {
    String value = null;
    try {
      AccessSecretVersionResponse response = client.accessSecretVersion(key);
      ByteString data = response.getPayload().getData();
      value = data.toStringUtf8();
    } catch (Exception ex) {
      LOG.error("Cloud not get secret: " + ex.getMessage());
    }

    return value;
  }
}
