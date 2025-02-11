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
import com.google.common.collect.ImmutableMap;
import org.apache.commons.text.StringSubstitutor;
import org.apache.commons.text.lookup.StringLookup;
import org.apache.commons.text.lookup.StringLookupFactory;

/**
 * A class that provides a {@link org.apache.commons.text.StringSubstitutor}. It replaces template
 * strings with either a Secret Manager payload or writes the payload to a file, and substitutes the
 * path to the file.
 */
public class SecretManagerStringSubstitutor extends StringSubstitutor {

  public SecretManagerStringSubstitutor(SecretManagerServiceClient client) {
    super(
        StringLookupFactory.INSTANCE.interpolatorStringLookup(
            ImmutableMap.<String, StringLookup>of(
                "secretManager",
                StringLookupFactory.INSTANCE.interpolatorStringLookup(new SecretLookup(client)),
                "secretManagerToFilePath",
                StringLookupFactory.INSTANCE.interpolatorStringLookup(
                    new SecretLookupToFile(client))),
            null,
            true));
  }
}
