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
