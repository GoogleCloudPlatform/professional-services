/*
 * Copyright (C) 2024 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not
 * use this file except in compliance with the License. You may obtain a copy of
 * the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS, WITHOUT
 * WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the
 * License for the specific language governing permissions and limitations under
 * the License.
 */
package com.google.cloud.pso.benchmarks.redis.config;

import lombok.AllArgsConstructor;
import lombok.Getter;

/** Represents the redis configuration parameters. */
@AllArgsConstructor
@Getter
public class RedisConfig {
  /** The host name or IP address of the Redis server. */
  private final String hostName;

  /** The port number on which the Redis server is listening. */
  private final int port;
}
