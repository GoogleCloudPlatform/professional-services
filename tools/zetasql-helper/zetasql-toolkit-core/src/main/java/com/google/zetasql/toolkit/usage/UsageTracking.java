/*
 * Copyright 2023 Google LLC All Rights Reserved
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

package com.google.zetasql.toolkit.usage;

import com.google.api.gax.rpc.FixedHeaderProvider;
import com.google.api.gax.rpc.HeaderProvider;
import com.google.common.collect.ImmutableMap;
import java.io.IOException;
import java.io.InputStream;
import java.util.Properties;

public class UsageTracking {
  private static final String USER_AGENT_HEADER = "user-agent";
  private static final String USER_AGENT_VALUE;

  static {
    String revision = "UNSET";

    InputStream propertiesInputStream =
        UsageTracking.class.getResourceAsStream("/zetasql-toolkit-core.properties");

    try (propertiesInputStream) {
      Properties properties = new Properties();
      properties.load(propertiesInputStream);
      revision = properties.getProperty("zetasql.toolkit.version", "UNSET");
    } catch (IOException ignored) {
    }

    USER_AGENT_VALUE = String.format("google-pso-tool/zetasql-toolkit/%s", revision);
  }

  public static final HeaderProvider HEADER_PROVIDER =
      FixedHeaderProvider.create(ImmutableMap.of(USER_AGENT_HEADER, USER_AGENT_VALUE));

  private UsageTracking() {}
}
