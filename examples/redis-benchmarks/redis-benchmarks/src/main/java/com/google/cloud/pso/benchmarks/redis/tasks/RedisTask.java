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

/** Defines the contract for a task to be executed within a Redis benchmarking scenario. */
public interface RedisTask {
  /**
   * Returns the name of the task.
   *
   * <p>This name is typically used for identification and logging purposes.
   *
   * @return The name of the task.
   */
  String getName();

  /**
   * Performs initialization tasks before the main execution loop.
   *
   * <p>This method is called once at the beginning of the task and can be used to set up resources,
   * establish connections, or perform any other necessary preparations.
   *
   * <p>This method is optional and has a default empty implementation.
   */
  default void initialize() {}

  /**
   * The core execution logic of the task.
   *
   * <p>This method is called repeatedly until the test duration is complete. It should contain the
   * primary actions the task needs to perform, such as sending Redis commands, processing
   * responses, or updating metrics.
   */
  void run();

  /**
   * Cleans up resources after the task has finished executing.
   *
   * <p>This method is called once at the end of the task and should be used to release any
   * resources that were acquired during the task's execution.
   *
   * <p>This method is optional and has a default empty implementation.
   */
  default void cleanUp() {}
}
