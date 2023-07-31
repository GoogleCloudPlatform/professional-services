/*
 * Copyright 2023 Google LLC
 *
 * <p>Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file
 *  except in compliance with the License. You may obtain a copy of the License at
 *
 * <p>http://www.apache.org/licenses/LICENSE-2.0
 *
 * <p>Unless required by applicable law or agreed to in writing, software distributed under the
 * License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either
 * express or implied. See the License for the specific language governing permissions and
 * limitations under the License.
 */

package com.middleware.controller.cache;

import java.io.IOException;
import java.util.Optional;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import redis.clients.jedis.JedisPool;
import redis.clients.jedis.JedisPoolConfig;

/**
 * Utility class to initialize the redis connection pool.
 *
 * <p>REDIS_HOST and REDIS_PORT are the environment variables that are used to initialize the
 * connection pool.
 */
public class RedisUtil {
  private static final Logger logger = LoggerFactory.getLogger(RedisUtil.class);

  public static final JedisPool JEDIS_POOL = init();

  private static JedisPool init() {
    JedisPoolConfig poolConfig = new JedisPoolConfig();
    try {
      String host =
          Optional.ofNullable(System.getenv("REDIS_HOST"))
              .orElseThrow(() -> new IOException("REDIS_HOST is not set in the environment"));
      String port =
          Optional.ofNullable(System.getenv("REDIS_PORT"))
              .orElseThrow(() -> new IOException("REDIS_PORT is not set in the environment"));

      return new JedisPool(poolConfig, host, Integer.parseInt(port));
    } catch (IOException e) {
      logger.info("Problem initializing the jedispool for redis");
      return new JedisPool();
    }
  }
}
