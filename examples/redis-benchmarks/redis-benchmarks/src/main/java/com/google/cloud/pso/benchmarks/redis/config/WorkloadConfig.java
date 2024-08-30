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

import com.google.cloud.pso.benchmarks.redis.tasks.TaskType;
import java.util.List;
import lombok.Getter;
import lombok.Setter;

/** Configuration settings for the workload. */
@Setter
@Getter
public class WorkloadConfig {
  private String project;
  private int runDurationMinutes;
  private double cpuScalingFactor;
  private RedisConfig redisConfig;
  private double writeRatio;
  private List<TaskType> taskTypes;
}
