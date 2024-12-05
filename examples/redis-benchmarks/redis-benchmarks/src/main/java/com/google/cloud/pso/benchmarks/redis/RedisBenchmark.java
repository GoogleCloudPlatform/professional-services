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

import com.beust.jcommander.JCommander;
import com.google.cloud.pso.benchmarks.redis.config.CommandLineArgs;
import com.google.cloud.pso.benchmarks.redis.config.RedisConfig;
import com.google.cloud.pso.benchmarks.redis.config.WorkloadConfig;
import com.google.cloud.pso.benchmarks.redis.tasks.TaskType;
import java.io.IOException;
import java.util.Arrays;
import java.util.List;
import java.util.function.Function;
import java.util.stream.Collectors;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

/**
 * {@link RedisBenchmark} class is the main entry point for executing benchmark tests against a
 * Redis database. It parses command-line arguments, sets up the workload configuration, and
 * initiates the benchmark execution.
 */
public class RedisBenchmark {
  private static final Logger LOG = LoggerFactory.getLogger(RedisBenchmark.class);

  /**
   * The main method of the RedisBenchmark application.
   *
   * <p>This method performs the following steps:
   *
   * <ol>
   *   <li>Parses command-line arguments using JCommander.
   *   <li>If the "--help" option is provided, prints usage information and exits.
   *   <li>Otherwise, creates a WorkloadExecutor with the parsed configuration.
   *   <li>Starts the benchmark execution using the workloadExecutor.
   * </ol>
   *
   * @param args Command-line arguments passed to the application.
   * @throws IllegalAccessException If there's an issue accessing the workload configuration.
   * @throws IOException If an error occurs during input/output operations.
   */
  public static void main(String[] args) throws IllegalAccessException, IOException {

    CommandLineArgs options = new CommandLineArgs();
    JCommander jCommander = JCommander.newBuilder().addObject(options).build();

    jCommander.parse(args);

    if (options.help) {
      jCommander.usage();
      return;
    }

    WorkloadConfig workloadConfig = new WorkloadConfig();
    workloadConfig.setProject(options.getValue(options.project, "PROJECT_ID", Function.identity()));
    workloadConfig.setRunDurationMinutes(
        options.getValue(options.runDurationMinutes, "RUNDURATION_MINUTES", Integer::valueOf, 1));
    workloadConfig.setCpuScalingFactor(
        options.getValue(options.cpuScalingFactor, "CPU_SCALING_FACTOR", Double::parseDouble, 1.0));
    workloadConfig.setWriteRatio(
        options.getValue(options.writeRatio, "WRITE_RATIO", Double::parseDouble, 0.2));
    workloadConfig.setTaskTypes(
        options.getValue(options.taskTypes, "TASK_TYPES", RedisBenchmark::convertToTaskTypes));

    LOG.info(
        "Supplied parameters: Project:{}, RunDuration:{}, CpuScalingFactor:{}, writeRatio:{}, TaskTypes:{}",
        workloadConfig.getProject(),
        workloadConfig.getRunDurationMinutes(),
        workloadConfig.getCpuScalingFactor(),
        workloadConfig.getWriteRatio(),
        workloadConfig.getTaskTypes().stream()
            .map(TaskType::getType)
            .collect(Collectors.joining(",")));

    int cores = Runtime.getRuntime().availableProcessors();
    int maxParallelism = (int) Math.max(cores * workloadConfig.getCpuScalingFactor(), 1);
    LOG.info("Cores: {} and max parallelism: {}", cores, maxParallelism);

    RedisConfig redisConfig =
        new RedisConfig(
            options.getValue(options.redishost, "REDIS_HOST", Function.identity(), "localhost"),
            options.getValue(options.redisport, "REDIS_PORT", Integer::valueOf, 6379));
    workloadConfig.setRedisConfig(redisConfig);

    WorkloadExecutor workloadExecutor = new WorkloadExecutor(workloadConfig);

    workloadExecutor.run();
  }

  /**
   * Converts a comma-separated string of task type names into a list of TaskType enums.
   *
   * @param taskTypeNames A comma-separated string of task type names (e.g.,
   *     "SETGET,LISTOPERATIONS").
   * @return A list of TaskType enums corresponding to the input names. If the input is null,
   *     returns null.
   */
  private static List<TaskType> convertToTaskTypes(String taskTypeNames) {
    if (taskTypeNames == null) return null;

    return Arrays.stream(taskTypeNames.split(","))
        .map(TaskType::withName)
        .collect(Collectors.toList());
  }
}
