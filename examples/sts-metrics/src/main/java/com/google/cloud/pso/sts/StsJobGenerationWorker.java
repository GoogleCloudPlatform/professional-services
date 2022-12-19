/*
 * Copyright 2022 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

package com.google.cloud.pso.sts;

import java.io.IOException;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

/**
 * A thread that creates STS immediately run jobs
 */
public class StsJobGenerationWorker implements Runnable {

  private static final Logger logger = LoggerFactory.getLogger(StsJobGenerationWorker.class);
  private int numberOfJobs;
  private String jobNamePrefix;

  public StsJobGenerationWorker(int numberOfJobs, String jobNamePrefix) {
    this.numberOfJobs = numberOfJobs;
    this.jobNamePrefix = jobNamePrefix;
  }

  @Override
  public void run() {
    List<String> prefixList = new ArrayList<>();
    prefixList.add("dummy-prefix");
    for (int i = 0; i < numberOfJobs; i++) {
      String jobName = jobNamePrefix + "-" + Instant.now().toEpochMilli();
      try {
        StsJobHelper.createStsJob(jobName, StsMetricsMain.PROJECT_ID, StsMetricsMain.SRC_BUCKET,
            StsMetricsMain.DEST_BUCKET, prefixList, "eshen-test", StsMetricsMain.FULL_TOPIC_ID);
      } catch (IOException e) {
        logger.error(String.format("Failed to create STS job %s", jobName), e);
      }
    }
  }
}
