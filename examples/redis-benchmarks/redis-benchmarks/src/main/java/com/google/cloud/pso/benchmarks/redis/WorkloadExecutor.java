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
package com.google.cloud.pso.benchmarks.redis;

import com.google.cloud.pso.benchmarks.redis.compression.LZ4Compression;
import com.google.cloud.pso.benchmarks.redis.config.WorkloadConfig;
import com.google.cloud.pso.benchmarks.redis.model.Profile;
import com.google.cloud.pso.benchmarks.redis.serde.MessagePack;
import com.google.cloud.pso.benchmarks.redis.tasks.*;
import java.time.Duration;
import java.util.HashMap;
import java.util.Map;
import java.util.Random;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.TimeUnit;
import java.util.function.Supplier;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import redis.clients.jedis.ConnectionPoolConfig;
import redis.clients.jedis.JedisPooled;

/**
 * Class orchestrates the execution of Redis-based benchmark tasks. It manages thread pools, task
 * creation, and the lifecycle of benchmark execution.
 */
public class WorkloadExecutor {
  private static final Logger LOG = LoggerFactory.getLogger(WorkloadExecutor.class);
  private static final Random random = new Random();
  private final WorkloadConfig config;
  private final Map<String, PayloadGenerator<?>> payloadGeneratorByTaskType;
  private final int maxRunDurationInSeconds;
  private final int maxParallelism;

  /**
   * Constructs a WorkloadExecutor with the specified configuration.
   *
   * @param config The configuration settings for the workload.
   */
  public WorkloadExecutor(final WorkloadConfig config) {
    this.config = config;
    this.maxRunDurationInSeconds = config.getRunDurationMinutes() * 60;
    int cores = Runtime.getRuntime().availableProcessors();
    this.maxParallelism = (int) Math.max(cores * config.getCpuScalingFactor(), 1);
    this.payloadGeneratorByTaskType = new HashMap<>();
  }

  /**
   * Executes the benchmark workload according to the defined configuration.
   *
   * <p>This method creates a fixed-size thread pool, initializes metrics publishing, determines
   * task IDs based on environment variables, and creates a Jedis connection pool. It then iterates
   * over the configured number of tasks, creates instances of the specified RedisTask types, and
   * submits them to the executor service for parallel execution.
   *
   * <p>A shutdown hook is registered to gracefully shut down the executor and publish final metrics
   * before the JVM terminates.
   */
  public void run() {
    LOG.info("Executing tasks with maximum parallelism of {}", maxParallelism);
    ExecutorService executorService = Executors.newFixedThreadPool(maxParallelism + 2);
    final int maxStartDelayInSec = 5;
    String cloudRunTaskIndex = System.getenv("CLOUD_RUN_TASK_INDEX");
    String taskPrefix =
        cloudRunTaskIndex != null ? String.format("ti:%s:id:", cloudRunTaskIndex) : "id:";
    final JedisPooled jedisClient = createJedisClient(this.maxParallelism);
    final int taskTypesCount = this.config.getTaskTypes().size();
    for (int i = 0; i < maxParallelism; i++) {
      String taskId = taskPrefix + (i + 1);
      RedisTask task =
          createRedisTask(this.config.getTaskTypes().get(i % taskTypesCount), taskId, jedisClient);

      TaskExecutor taskExecutor =
          new TaskExecutor(
              taskId,
              task,
              Duration.ofSeconds(random.nextInt(maxStartDelayInSec)),
              Duration.ofSeconds(maxRunDurationInSeconds));
      executorService.submit(taskExecutor);
    }

    Runtime.getRuntime()
        .addShutdownHook(
            new Thread(
                () -> {
                  shutdownAndAwaitTermination(
                      executorService,
                      Duration.ofSeconds(maxStartDelayInSec + maxRunDurationInSeconds));
                }));
    executorService.shutdown(); //  Tell the executor service to stop accepting new tasks
  }

  /**
   * Creates a JedisPooled client for interacting with Redis.
   *
   * @param maxConnections The maximum number of active connections in the pool.
   * @return The configured JedisPooled client.
   */
  private JedisPooled createJedisClient(int maxConnections) {

    ConnectionPoolConfig poolConfig = new ConnectionPoolConfig();
    // maximum active connections in the pool, tune this according to your needs and application
    // type default is 8
    poolConfig.setMaxTotal(maxConnections);

    // maximum idle connections in the pool, default is 8
    poolConfig.setMaxIdle(maxConnections / 2);
    // minimum idle connections in the pool, default 0
    poolConfig.setMinIdle(0);

    // Enables waiting for a connection to become available.
    poolConfig.setBlockWhenExhausted(true);
    // The maximum number of seconds to wait for a connection to become available
    poolConfig.setMaxWait(Duration.ofSeconds(1));

    // Enables sending a PING command periodically while the connection is idle.
    poolConfig.setTestWhileIdle(true);
    // controls the period between checks for idle connections in the pool
    poolConfig.setTimeBetweenEvictionRuns(Duration.ofSeconds(1));

    // JedisPooled does all hard work on fetching and releasing connection to the pool
    // to prevent connection starvation
    return new JedisPooled(
        poolConfig,
        this.config.getRedisConfig().getHostName(),
        this.config.getRedisConfig().getPort());
  }

  /**
   * Creates an instance of a RedisTask based on the given task type and other parameters.
   *
   * @param taskType The type of Redis task to create.
   * @param taskId The unique identifier for the task.
   * @param jedisClient The Jedis client for Redis interaction.
   * @return An instance of the specified RedisTask type.
   * @throws RuntimeException If the specified task type is invalid.
   */
  private RedisTask createRedisTask(
      final TaskType taskType, final String taskId, final JedisPooled jedisClient) {
    switch (taskType) {
      case SETGET:
        return new SetGetTask(
            taskId,
            String.format("%s:sg", taskId),
            jedisClient,
            getPayloadGenerator(
                "SetGetTask",
                () ->
                    new PayloadGenerator<Profile>(
                        new MessagePack<Profile>(),
                        new LZ4Compression(),
                        new Profile(),
                        Profile.class)),
            this.config.getWriteRatio());
      case LISTOPERATIONS:
        return new ListOperationsTask(
            taskId,
            String.format("%s:lo", taskId),
            jedisClient,
            getPayloadGenerator(
                "ListOperation",
                () ->
                    new PayloadGenerator<Profile>(
                        new MessagePack<Profile>(),
                        new LZ4Compression(),
                        new Profile(),
                        Profile.class)),
            this.config.getWriteRatio());
      default:
        throw new RuntimeException("Invalid task type");
    }
  }

  /**
   * Retrieves or creates a PayloadGenerator instance for the specified task type.
   *
   * <p>If a PayloadGenerator already exists for the task type in the internal cache, it is
   * returned. Otherwise, a new instance is created using the provided Supplier and added to the
   * cache.
   *
   * @param name The name of the task type.
   * @param instanceCreator A Supplier that creates a new PayloadGenerator instance if needed.
   * @return A PayloadGenerator instance for the specified task type.
   */
  private PayloadGenerator<?> getPayloadGenerator(
      final String name, final Supplier<PayloadGenerator<?>> instanceCreator) {
    PayloadGenerator<?> payloadGenerator = this.payloadGeneratorByTaskType.get(name);
    if (payloadGenerator == null) {
      LOG.debug("Creating Payload generator");
      payloadGenerator = instanceCreator.get();
      this.payloadGeneratorByTaskType.put(name, payloadGenerator);
    }
    return payloadGenerator;
  }

  /**
   * Shuts down the ExecutorService gracefully and waits for task termination.
   *
   * @param executorService The ExecutorService to shut down.
   * @param timeoutDuration The maximum time to wait for task termination.
   */
  private void shutdownAndAwaitTermination(
      ExecutorService executorService, Duration timeoutDuration) {

    try {
      // Wait a while for existing tasks to terminate
      if (!executorService.awaitTermination(timeoutDuration.getSeconds(), TimeUnit.SECONDS)) {
        LOG.warn(
            "Tasks did not complete within {} seconds. Cancelling tasks..",
            timeoutDuration.getSeconds());
        executorService.shutdownNow(); // Cancel currently executing tasks
        // Wait a while for tasks to respond to being cancelled
        if (!executorService.awaitTermination(timeoutDuration.getSeconds(), TimeUnit.SECONDS))
          LOG.warn("Tasks did not terminate");
      }
    } catch (InterruptedException ie) {
      // (Re-)Cancel if current thread also interrupted
      executorService.shutdownNow();
      // Preserve interrupt status
      Thread.currentThread().interrupt();
    }
  }
}
