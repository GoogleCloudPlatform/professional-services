/*
 * Copyright (C) 2020 Google Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

package com.google.cloud.pso.hashpipeline;

import com.google.cloud.secretmanager.v1.AccessSecretVersionResponse;
import com.google.cloud.secretmanager.v1.SecretManagerServiceClient;
import com.google.protobuf.ByteString;
import java.io.IOException;
import java.security.InvalidKeyException;
import java.security.NoSuchAlgorithmException;
import java.util.Base64;
import java.util.Formatter;
import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import org.apache.beam.sdk.transforms.DoFn;
import org.apache.beam.sdk.transforms.DoFn.ProcessContext;
import org.apache.beam.sdk.transforms.DoFn.ProcessElement;
import org.apache.beam.sdk.transforms.DoFn.Setup;
import org.apache.beam.sdk.values.KV;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

public class HashQuotesDoFn extends DoFn<KV<String, String>, KV<String, String>> {
  private static final Logger LOG = LoggerFactory.getLogger(Hashpipeline.class);
  private final String HMAC_SHA256 = "HmacSHA256";
  private String secretPath;
  private String salt;
  private SecretKeySpec keySpec;

  public HashQuotesDoFn(String secretPath, String salt) {
    this.secretPath = secretPath + "/versions/latest";
    this.salt = salt;
  }

  @Setup
  public void setup() throws RuntimeException {
    try (SecretManagerServiceClient client = SecretManagerServiceClient.create()) {
      AccessSecretVersionResponse response = client.accessSecretVersion(this.secretPath);
      ByteString data = response.getPayload().getData();
      String stripped = data.toStringUtf8().replace("\n", "").replace("\r", "");
      byte[] hashkey = Base64.getDecoder().decode(stripped);
      this.keySpec = new SecretKeySpec(hashkey, HMAC_SHA256);
    } catch (Exception e) {
      LOG.error("Failed to create DLP Service Client", e.getMessage());
      throw new RuntimeException(e);
    }
  }

  @ProcessElement
  public void processElement(ProcessContext c)
      throws IOException, NoSuchAlgorithmException, InvalidKeyException {
    KV<String, String> entry = c.element();
    Mac hmac = Mac.getInstance(HMAC_SHA256);
    hmac.init(this.keySpec);
    hmac.update(this.salt.getBytes());
    String potentialSSN = entry.getValue().replace("-", "");
    String digest = this.toHexString(hmac.doFinal(potentialSSN.getBytes()));
    c.output(KV.of(entry.getKey(), digest));
  }

  private String toHexString(byte[] bytes) {
    Formatter formatter = new Formatter();
    for (byte b : bytes) {
      formatter.format("%02x", b);
    }
    String digest = formatter.toString();
    formatter.close();
    return digest;
  }
}
