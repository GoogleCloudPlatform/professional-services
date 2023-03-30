package com.google.zetasql.toolkit.usage;

import com.google.cloud.bigquery.BigQuery;
import com.google.cloud.bigquery.BigQuery.JobListOption;
import com.google.cloud.bigquery.BigQueryOptions;
import java.util.Optional;

public class UsageTrackerImpl implements UsageTracker {
  private Optional<BigQuery> bigqueryClient;

  public UsageTrackerImpl() {
    try {
      this.bigqueryClient =
          Optional.of(
              BigQueryOptions.newBuilder()
                  .setHeaderProvider(UsageTracking.HEADER_PROVIDER)
                  .build()
                  .getService());
    } catch (Exception err) {
      this.bigqueryClient = Optional.empty();
    }
  }

  @Override
  public void trackUsage() {
    bigqueryClient.ifPresent(
        client -> {
          try {
            client.listJobs(JobListOption.pageSize(0));
          } catch (Exception ignored) {
          }
        });
  }
}
