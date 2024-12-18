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
package com.google.cloud.pso.benchmarks.redis.tasks;

import com.google.cloud.pso.benchmarks.redis.PayloadGenerator;
import com.google.cloud.pso.benchmarks.redis.util.MathUtils;
import java.nio.charset.StandardCharsets;
import java.util.Random;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import redis.clients.jedis.JedisPooled;

/** Class represents a task specifically focusing on set and get operations. */
public class SetGetTask implements RedisTask {

  private static final Logger LOG = LoggerFactory.getLogger(SetGetTask.class);
  private final String taskId;
  private final String keyPrefix;
  private final JedisPooled jedisClient;
  private final double writeRatio;
  private final PayloadGenerator<?> payloadGenerator;
  private final Random random = new Random();
  private int hits;
  private int misses;
  private long counter;
  private static final double millisecondDivisor = (1000.0 * 1000.0);

  public SetGetTask(
      String taskId,
      String keyPrefix,
      JedisPooled jedisClient,
      PayloadGenerator<?> payloadGenerator,
      double writeRatio) {
    this.taskId = taskId;
    this.keyPrefix = keyPrefix;
    this.jedisClient = jedisClient;
    this.writeRatio = writeRatio;
    this.payloadGenerator = payloadGenerator;
  }

  /**
   * Returns the simple name of this class, effectively serving as a task identifier.
   *
   * @return The simple name of the class.
   */
  @Override
  public String getName() {
    return this.getClass().getSimpleName();
  }

  /**
   * Initializes the task by resetting counters used for tracking hits, misses, and total
   * operations. This method should be called before the task starts executing to ensure accurate
   * statistics.
   */
  @Override
  public void initialize() {
    // LOG.info("Thread initialized for task:{}", this.taskId);
    hits = 0;
    misses = 0;
    counter = 0;
  }

  /** Core execution logic of the Redis set and get task. */
  @Override
  public void run() {
    String key = null;
    for (int i = 1; i <= 100; i++) {
      if (counter < 10 || Math.random() < writeRatio) { // Write the value
        key = String.format("%s:%s", this.keyPrefix, counter);
        long startTime = System.nanoTime();
        jedisClient.set(
            key.getBytes(StandardCharsets.UTF_8), this.payloadGenerator.getPayloadBytes());
        counter++;
      } else {
        key = String.format("%s:%s", this.keyPrefix, MathUtils.getRandomLong(0, counter));
        long startTime = System.nanoTime();
        if (jedisClient.get(key.getBytes(StandardCharsets.UTF_8)) != null) {
          hits++;
        } else {
          misses++;
        }
      }
    }

    try {
      Thread.sleep(10 + random.nextInt(5));
    } catch (InterruptedException e) {
      LOG.warn("Thread interrupted for task:{}", this.taskId);
      throw new RuntimeException(e);
    }
  }

  /**
   * Calculates the total number of reads, potentially for later reporting or analysis. Additional
   * cleanup actions specific to the task could be added here.
   */
  @Override
  public void cleanUp() {
    long totalReads = hits + misses;
    LOG.info(
        "Total writes: {}, reads: {}, percent of hits:{} and percent of misses:{} in client:{}",
        counter,
        totalReads,
        ((hits * 1.0) / totalReads) * 100,
        ((misses * 1.0) / totalReads) * 100,
        this.taskId);
  }
}
