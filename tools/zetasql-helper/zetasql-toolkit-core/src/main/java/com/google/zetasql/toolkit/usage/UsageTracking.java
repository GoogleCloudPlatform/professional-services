package com.google.zetasql.toolkit.usage;

import com.google.api.gax.rpc.FixedHeaderProvider;
import com.google.api.gax.rpc.HeaderProvider;
import com.google.common.collect.ImmutableMap;

public class UsageTracking {

  private static final String USER_AGENT_HEADER = "user-agent";
  private static final String USER_AGENT_VALUE = "google-pso-tool/zetasql-toolkit/0.1.1";

  public static final HeaderProvider HEADER_PROVIDER =
      FixedHeaderProvider.create(ImmutableMap.of(USER_AGENT_HEADER, USER_AGENT_VALUE));

  private UsageTracking() {}
}
