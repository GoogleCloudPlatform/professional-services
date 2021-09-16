package functions;

import static functions.ScanProjectQuotasHelper.createGCPResourceClient;
import static functions.ScanProjectQuotasHelper.getQuota;
import static functions.ScanProjectQuotasHelper.getTimeSeriesFilter;
import static functions.ScanProjectQuotasHelper.loadBigQueryTable;

import com.google.cloud.functions.BackgroundFunction;
import com.google.cloud.functions.Context;
import com.google.cloud.monitoring.v3.MetricServiceClient.ListTimeSeriesPagedResponse;
import com.google.monitoring.v3.Aggregation.Aligner;
import com.google.monitoring.v3.Aggregation.Reducer;
import com.google.monitoring.v3.ProjectName;
import functions.eventpojos.GCPProject;
import functions.eventpojos.GCPResourceClient;
import functions.eventpojos.PubSubMessage;
import functions.eventpojos.TimeSeriesQuery;
import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.util.Base64;
import java.util.logging.Level;
import java.util.logging.Logger;

public class ScanProjectQuotas implements BackgroundFunction<PubSubMessage> {
  // Cloud Function Environment variable for Threshold
  public static final String THRESHOLD = System.getenv("THRESHOLD");
  // BigQuery Dataset name
  public static final String BIG_QUERY_DATASET = System.getenv("BIG_QUERY_DATASET");
  // BigQuery Table name
  public static final String BIG_QUERY_TABLE = System.getenv("BIG_QUERY_TABLE");

  // ==== Time Series Filters ====
  // Last 7 days
  public static final Integer DURATION = 7 * 24 * 60 * 60;
  public static final Aligner ALIGNER = Aligner.ALIGN_MAX;
  public static final Reducer REDUCER = Reducer.REDUCE_MAX;
  // Last 7 days
  public static final Integer TIME_INTERVAL_START = 7 * 24 * 60 * 60 * 1000;
  public static final String GROUP_BY_CLAUSE_1 = "metric.quota_metric";
  public static final String GROUP_BY_CLAUSE_2 = "resource.location";

  private static final Logger logger = Logger.getLogger(ScanProjectQuotas.class.getName());

  /*
   * API to accept request to Cloud Function
   * */
  @Override
  public void accept(PubSubMessage message, Context context) {
    if (message.getData() == null) {
      logger.log(Level.WARNING, "No Project Id provided");
      return;
    }
    // project Id received from Pub/Sub topic
    String projectId =
        new String(
            Base64.getDecoder().decode(message.getData().getBytes(StandardCharsets.UTF_8)),
            StandardCharsets.UTF_8);
    try {
      GCPProject gcpProject = new GCPProject();
      gcpProject.setProjectId(projectId);
      gcpProject.setProjectName(ProjectName.of(projectId).toString());
      GCPResourceClient gcpResourceClient = createGCPResourceClient();
      TimeSeriesQuery timeSeriesQuery = getTimeSeriesFilter();
      // 1. Scan Allocation quota and load in main table in BigQuery
      getAllocationUsageQuotas(gcpResourceClient, timeSeriesQuery, gcpProject);
      // 2. Scan Rate quotas and load in main table
      getRateUsageQuotas(gcpResourceClient, timeSeriesQuery, gcpProject);
      // 3. Scan limit and load in different table
      getQuotaLimits(gcpResourceClient, timeSeriesQuery, gcpProject);
    } catch (Exception e) {
      logger.log(Level.SEVERE, " " + e.getMessage(), e);
    }
  }

  /*
   * API to get all Allocation quotas usage for this project
   * */
  private static void getAllocationUsageQuotas(
      GCPResourceClient gcpResourceClient, TimeSeriesQuery timeSeriesQuery, GCPProject gcpProject) {
    try {
      scanQuota(
          gcpResourceClient, timeSeriesQuery.getAllocationQuotaUsageFilter(), gcpProject, false);
    } catch (IOException e) {
      logger.log(Level.SEVERE, "Error fetching Allocation usage quotas " + e.getMessage(), e);
    }
  }

  /*
   * API to get all Rate quotas usage for this project
   * */
  private static void getRateUsageQuotas(
      GCPResourceClient gcpResourceClient, TimeSeriesQuery timeSeriesQuery, GCPProject gcpProject) {
    try {
      scanQuota(gcpResourceClient, timeSeriesQuery.getRateQuotaUsageFilter(), gcpProject, false);
    } catch (IOException e) {
      logger.log(Level.SEVERE, "Error fetching Rate usage quotas  " + e.getMessage(), e);
    }
  }

  /*
   * API to get all Quota Limits for this project
   * */
  private static void getQuotaLimits(
      GCPResourceClient gcpResourceClient, TimeSeriesQuery timeSeriesQuery, GCPProject gcpProject) {
    try {
      scanQuota(gcpResourceClient, timeSeriesQuery.getQuotaLimitFilter(), gcpProject, true);
    } catch (IOException e) {
      logger.log(Level.SEVERE, "Error fetching quota limits  " + e.getMessage(), e);
    }
  }

  /*
   * API to get quotas from APIs and load in BigQuery
   * */
  private static void scanQuota(
      GCPResourceClient gcpResourceClient,
      String filter,
      GCPProject gcpProject,
      Boolean isLimitData)
      throws IOException {
    ListTimeSeriesPagedResponse projectQuotas = getQuota(gcpProject.getProjectName(), filter);
    loadBigQueryTable(gcpResourceClient, projectQuotas, gcpProject.getProjectId(), isLimitData);
    logger.log(
        Level.INFO, "Quotas loaded successfully for project Id:" + gcpProject.getProjectId());
  }
}
