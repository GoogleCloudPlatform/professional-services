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

import com.beust.jcommander.IStringConverter;
import com.beust.jcommander.Parameter;
import com.beust.jcommander.Parameters;
import com.google.cloud.pso.benchmarks.redis.tasks.TaskType;
import java.util.List;
import java.util.function.Function;

/**
 * Class {@link CommandLineArgs} represents various input options that can be supplied by the user.
 */
@Parameters(separators = "=")
public class CommandLineArgs {

  public static class TaskTypeConvertor implements IStringConverter<TaskType> {
    @Override
    public TaskType convert(String value) {
      return TaskType.withName(value);
    }
  }

  @Parameter(names = "--project", description = "Cloud Project identifier. e.g: test-project")
  public String project;

  @Parameter(names = "--hostname", description = "Redis host name or ip address. e.g:10.167.20.44")
  public String redishost;

  @Parameter(names = "--port", description = "Redis port number")
  public Integer redisport;

  @Parameter(
      names = "--runduration_minutes",
      description = "Amount of time to run the application in minutes.")
  public Integer runDurationMinutes;

  @Parameter(
      names = "--cpu_scaling_factor",
      description =
          "Determines the parallelism by multiplying cpu_scaling_factor with available cores. E.g: 1.0")
  public Double cpuScalingFactor;

  @Parameter(
      names = "--write_ratio",
      description = "Determines the percent of writes compared to reads. E.g: 0.2")
  public Double writeRatio;

  @Parameter(
      names = "--task_types",
      description = "Specifies the task types in comma separated value.",
      converter = TaskTypeConvertor.class)
  public List<TaskType> taskTypes;

  @Parameter(
      names = {"--help"},
      help = true)
  public boolean help = false;

  /**
   * Returns value if not null else returns default Value.
   *
   * @param <T> The type of the values.
   * @param value The first value to check.
   * @param defaultValue The default value to return if the first value is null.
   * @return The first non-null value between `value` and `defaultValue`.
   */
  private <T> T getFirstNonNullValue(T value, T defaultValue) {
    return value != null ? value : defaultValue;
  }

  /**
   * Retrieves a value from the environment variable or returns a default value.
   *
   * @param <T> The type of the value.
   * @param value An optional default value to return if the environment variable is not found or
   *     cannot be converted.
   * @param environVarName The name of the environment variable to retrieve.
   * @param typeConverter A function to convert the environment variable value to the desired type.
   * @return The value retrieved from the environment variable or the provided default value.
   * @throws NullPointerException if `environVarName` or `typeConverter` is null.
   */
  public <T> T getValue(T value, String environVarName, Function<String, T> typeConverter) {
    return getValue(value, environVarName, typeConverter, null);
  }

  /**
   * Retrieves a value from the environment variable or returns either specified value or default
   * value whichever is not null.
   *
   * @param <T> The type of the value.
   * @param value An optional default value to return.
   * @param environVarName The name of the environment variable to retrieve.
   * @param typeConverter A function to convert the environment variable value to the desired type.
   * @param defaultValue The default value to return if the environment variable is not found or
   *     cannot be converted.
   * @return The value retrieved from the environment variable or the provided default value.
   * @throws NullPointerException if `environVarName` or `typeConverter` is null.
   */
  public <T> T getValue(
      T value, String environVarName, Function<String, T> typeConverter, T defaultValue) {
    //  return value != null ? value: typeConverter.apply(System.getenv(environVarName));
    String envValue = System.getenv(environVarName);
    return envValue != null
        ? typeConverter.apply(envValue)
        : getFirstNonNullValue(value, defaultValue);
  }
}
