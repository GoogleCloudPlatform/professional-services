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

import java.util.Arrays;
import java.util.stream.Collectors;

/**
 * Represents the different types of tasks that can be performed in a Redis benchmark.
 *
 * <p>Each task type has a unique identifier (`type`) and a description that explains its purpose.
 */
public enum TaskType {
  /** Task demonstrating basic set and get operations in Redis. */
  SETGET("SetGet", "Demonstrates key-value operations"),

  /** Task demonstrating operations on Redis lists. */
  LISTOPERATIONS("ListOps", "Demonstrates list operations");

  /** A short string identifier for the task type. */
  private final String type;

  /** A description of the task type's purpose. */
  private final String description;

  /**
   * Private constructor to create a TaskType instance.
   *
   * @param type The short string identifier for the task type.
   * @param description The description of the task type's purpose.
   */
  TaskType(String type, String description) {
    this.type = type;
    this.description = description;
  }

  /**
   * Retrieves the short string identifier of this task type.
   *
   * @return The type of the task.
   */
  public String getType() {
    return type;
  }

  /**
   * Retrieves the description of this task type.
   *
   * @return The description of the task.
   */
  public String getDescription() {
    return description;
  }

  /**
   * Returns a comma-separated string of all supported task types.
   *
   * @return A comma-separated string of supported task types.
   */
  public static String getSupportedTypes() {
    return Arrays.stream(values()).map(TaskType::getType).collect(Collectors.joining(","));
  }

  /**
   * Retrieves the TaskType enum value corresponding to the given type string.
   *
   * @param type The string representation of the task type.
   * @return The matching TaskType enum value.
   * @throws IllegalArgumentException If the specified type is not a valid TaskType.
   */
  public static TaskType withName(String type) {
    for (TaskType e : values()) {
      if (e.getType().equals(type)) return e;
    }

    throw new IllegalArgumentException(
        String.format(
            "Invalid task type:%s. " + "Supported values are:%s", type, getSupportedTypes()));
  }
}
