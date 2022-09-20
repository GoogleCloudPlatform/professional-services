package com.google.cloud.sandbox.configuration;


import com.google.cloud.bigquery.BigQuery;
import com.google.cloud.bigquery.BigQueryOptions;
import com.google.cloud.resourcemanager.v3.ProjectsClient;
import java.io.IOException;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;


@Configuration
public class GoogleServiceConfiguration {

  @Bean
  public ProjectsClient projectClient() throws IOException {
    return ProjectsClient.create();
  }

  @Bean
  public BigQuery bigQueryClient() {
    return BigQueryOptions.getDefaultInstance().getService();
  }
}
