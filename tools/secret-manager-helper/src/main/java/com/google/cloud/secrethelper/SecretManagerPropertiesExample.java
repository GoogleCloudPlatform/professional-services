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
import java.io.Reader;
import java.nio.charset.Charset;
import java.util.Properties;
import org.apache.commons.text.StringSubstitutor;
import org.apache.commons.text.io.StringSubstitutorReader;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

/**
 * This class contains a sample main method that drives {@link
 * com.google.cloud.secrethelper.SecretManagerStringSubstitutor} to replace values in a properties
 * file.
 */
public class SecretManagerPropertiesExample {

  private static final Logger LOG = LoggerFactory.getLogger(SecretManagerPropertiesExample.class);

  public static void main(String[] args) throws IOException {
    Properties properties = new Properties();
    SecretManagerServiceClient client = SecretManagerServiceClient.create();
    StringSubstitutor secretSubstitutor = new SecretManagerStringSubstitutor(client);

    Reader propertiesFileReader =
        Files.newReader(new File("kafka.properties"), Charset.defaultCharset());
    properties.load(new StringSubstitutorReader(propertiesFileReader, secretSubstitutor));
    LOG.info(properties.toString());
  }
}
