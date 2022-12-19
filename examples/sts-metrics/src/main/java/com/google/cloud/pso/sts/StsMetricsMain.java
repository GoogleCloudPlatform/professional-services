package com.google.cloud.pso.sts;

import java.io.IOException;
import java.time.Instant;
import java.util.Properties;
import java.util.concurrent.Executors;
import java.util.concurrent.ScheduledExecutorService;
import java.util.concurrent.TimeUnit;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

public class StsMetricsMain {
  public static final String CONFIG_PROP_NAME = "config.properties";
  public static final Properties CONFIG_PROP = loadConfigProps(CONFIG_PROP_NAME);
  public static final String PROJECT_ID = CONFIG_PROP.getProperty("project.id");
  public static final String TOPIC_ID = CONFIG_PROP.getProperty("topic.id");
  public static final String FULL_TOPIC_ID = "projects/eshen-test-3/topics/" + TOPIC_ID;
  public static final String SUBSCRIPTION_ID = CONFIG_PROP.getProperty("subscription.id");
  public static final String SRC_BUCKET = CONFIG_PROP.getProperty("source.bucket");
  public static final String DEST_BUCKET = CONFIG_PROP.getProperty("destination.bucket");
  public static final String JOB_NAME_PREFIX = CONFIG_PROP.getProperty("job.name.prefix");
  public static final long MAX_RUN_TIME = 1000 * 60 * 30;
  public static final long SLEEP_TIME = 1000 * 60;


  private static final Logger logger = LoggerFactory.getLogger(StsMetricsMain.class);



  public static void main(String[] args) {
    try {
      long startTime = Instant.now().toEpochMilli();
      long elapsedTime = 0;
      Metrics.init();
      initSubscriber();
      generateStsJobs();
      while(elapsedTime < MAX_RUN_TIME) {
        Thread.sleep(SLEEP_TIME );
        elapsedTime = Instant.now().toEpochMilli() - startTime;
      }
    } catch (IOException | InterruptedException e) {
      logger.error(e.getMessage(), e);
    }

  }

  private static void initSubscriber() throws IOException {
    PubSubSubscriber stsJobNotificationSubscriber = new PubSubSubscriber(PROJECT_ID,
        TOPIC_ID, SUBSCRIPTION_ID, new StsJobNotificationHandler());
    stsJobNotificationSubscriber.run();

  }

  private static void generateStsJobs() {
    StsJobGenerationWorker worker = new StsJobGenerationWorker(3, JOB_NAME_PREFIX);
    ScheduledExecutorService scheduledExecutor = Executors.newSingleThreadScheduledExecutor();
    scheduledExecutor.scheduleAtFixedRate(worker, 0L, 20, TimeUnit.SECONDS);
  }

  private static Properties loadConfigProps (String fileName) {
    Properties props = new Properties();
    try {
      props.load(StsMetricsMain.class.getClassLoader().getResourceAsStream(fileName));
    } catch (IOException e) {
      logger.error(String.format("Failed to load %s", fileName), e);
    }
    return props;
  }
}