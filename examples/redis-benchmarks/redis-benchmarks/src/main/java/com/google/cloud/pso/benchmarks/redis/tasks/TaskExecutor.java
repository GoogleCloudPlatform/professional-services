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

import java.time.Duration;
import java.time.Instant;
import java.util.Random;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

/**
 * Class {@link TaskExecutor} is responsible for executing a specific RedisTask with a defined start
 * delay and duration. It manages the lifecycle of the task, including initialization, execution,
 * and cleanup.
 */
public class TaskExecutor implements Runnable {
  private static final Logger LOG = LoggerFactory.getLogger(TaskExecutor.class);

  /** A unique identifier for this task. */
  private final String taskId;

  /** The RedisTask instance to be executed. */
  private final RedisTask task;

  /** The delay before the task starts executing. */
  private final Duration startDelay;

  /** The time when the task should stop executing. */
  private final Instant endTime;

  /** A random number generator for potential use within the task. */
  private final Random random = new Random();

  /**
   * Constructs a TaskExecutor with the given parameters.
   *
   * @param taskId The unique identifier for this task.
   * @param task The RedisTask to be executed.
   * @param startDelay The delay before the task starts.
   * @param runDuration The total duration for which the task should run.
   */
  public TaskExecutor(String taskId, RedisTask task, Duration startDelay, Duration runDuration) {
    this.taskId = taskId;
    this.task = task;
    this.startDelay = startDelay;
    this.endTime = Instant.now().plus(startDelay).plus(runDuration);
  }

  /**
   * Executes the RedisTask according to the defined lifecycle.
   *
   * <p>This method first waits for the specified startDelay, then initializes the task, repeatedly
   * calls the task's run() method until the endTime is reached, and finally performs any necessary
   * cleanup. If interrupted, it logs a warning and throws a RuntimeException.
   */
  @Override
  public void run() {
    try {
      Thread.sleep(startDelay.toMillis());
      LOG.info(
          "Starting the {} using taskId:{} with endTime: {}",
          this.task.getName(),
          this.taskId,
          this.endTime);
      task.initialize();
      while (Instant.now().isBefore(endTime)) {
        task.run();
      }
      task.cleanUp();
    } catch (InterruptedException e) {
      LOG.warn("Thread interrupted for task:{}", this.taskId);
      throw new RuntimeException(e);
    }
  }
}
