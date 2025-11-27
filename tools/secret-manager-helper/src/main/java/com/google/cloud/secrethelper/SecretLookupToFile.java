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

import com.google.cloud.secretmanager.v1.SecretManagerServiceClient;
import com.google.common.io.Files;
import java.io.File;
import java.io.IOException;
import org.apache.commons.text.lookup.StringLookup;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

/**
 * {@link com.google.cloud.secrethelper.SecretLookupToFile} provides an implementation of {@link
 * org.apache.commons.text.lookup.StringLookup} that returns a Secret Manager secret payload for the
 * provided key.
 */
public class SecretLookupToFile implements StringLookup {

  private static final Logger LOG = LoggerFactory.getLogger(SecretLookupToFile.class);
  private final SecretManagerServiceClient client;

  public SecretLookupToFile(SecretManagerServiceClient client) {
    this.client = client;
  }

  @Override
  public String lookup(String key) {
    String value = null;
    try {
      File output = File.createTempFile("secretManagerToFile_", "");
      SecretLookup secretLookup = new SecretLookup(client);
      Files.write(secretLookup.lookup(key).getBytes(), output);
      value = output.getAbsolutePath();
      LOG.debug("Wrote secret " + key + " to " + value + ".");
    } catch (IOException ex) {
      LOG.error("Could not write secret: " + ex.getMessage());
    }
    return value;
  }
}
