package com.google.cloud.sandbox.service.impl;

import com.google.cloud.bigquery.BigQuery;
import com.google.cloud.bigquery.FieldValueList;
import com.google.cloud.bigquery.Job;
import com.google.cloud.bigquery.JobId;
import com.google.cloud.bigquery.JobInfo;
import com.google.cloud.bigquery.QueryJobConfiguration;
import com.google.cloud.bigquery.QueryParameterValue;
import com.google.cloud.bigquery.TableResult;
import com.google.cloud.sandbox.repository.ProjectRepository;
import com.google.cloud.sandbox.service.ProjectBillingService;
import java.sql.Timestamp;
import java.util.HashMap;
import java.util.UUID;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

@Service
public class ProjectBillingServiceImp implements ProjectBillingService {

  private BigQuery bigQuery;
  private ProjectRepository projectRepository;
  private String billingTable;
  private String parentId;

  public ProjectBillingServiceImp(BigQuery bigQuery,
      ProjectRepository projectRepository,
      @Value("${bigquery.billing.table}") String billingTable,
      @Value("${project.parent.id}") String parentId) {
    this.bigQuery = bigQuery;
    this.projectRepository = projectRepository;
    this.billingTable = billingTable;
    this.parentId = parentId;
  }

  public void checkActiveProjectLimits() {
    //Get all project id and budget in hashmap
    HashMap<String, Integer> idBudgetMap = new HashMap<>();
    projectRepository.findByActive(true)
        .forEach(e -> idBudgetMap.put(e.getId(), e.getBudget()));

    Timestamp earliestCreateTimestamp = projectRepository.findTopByActiveOrderByCreated(
        true).getCreated();

    QueryJobConfiguration queryConfig =
        QueryJobConfiguration.newBuilder(
                "SELECT project.id, sum(cost) as total_cost, "
                    + "SUM(IFNULL((SELECT SUM(c.amount) FROM UNNEST(credits) c), 0)) as total_credits "
                    + "FROM "+ billingTable + " "
                    + "WHERE _PARTITIONTIME >= TIMESTAMP_TRUNC(TIMESTAMP_MILLIS( @time ), DAY) "
                    + "AND EXISTS(SELECT * FROM UNNEST(project.ancestors) AS a WHERE a.resource_name = @parent ) "
                    + "GROUP BY 1;")
            .addNamedParameter("parent", QueryParameterValue.string(parentId))
            .addNamedParameter("time", QueryParameterValue.int64(earliestCreateTimestamp.getTime()))
            .setUseLegacySql(false)
            .build();
    // Create a job ID so that we can safely retry.
    JobId jobId = JobId.of(UUID.randomUUID().toString());
    Job queryJob = bigQuery.create(JobInfo.newBuilder(queryConfig).setJobId(jobId).build());

    // Wait for the query to complete.
    try {
      queryJob = queryJob.waitFor();
    } catch (InterruptedException e) {
      e.printStackTrace();
    }

    // Check for errors
    if (queryJob == null) {
      throw new RuntimeException("Job no longer exists");
    } else if (queryJob.getStatus().getError() != null) {
      throw new RuntimeException(queryJob.getStatus().getError().toString());
    }

    // Get the results.
    TableResult result = null;
    try {
      result = queryJob.getQueryResults();
    } catch (InterruptedException e) {
      e.printStackTrace();
    }

    // Print all pages of the results.
    for (FieldValueList row : result.iterateAll()) {
      // String type
      String projectId = row.get("id").getStringValue();
      Double cost = row.get("total_cost").getDoubleValue();
      Double credits = row.get("total_credits").getDoubleValue();
      // Optional<Integer> budget = Optional.ofNullable(idBudgetMap.get(projectId));
      System.out.println("projectId = " + projectId);
    }
  }
}