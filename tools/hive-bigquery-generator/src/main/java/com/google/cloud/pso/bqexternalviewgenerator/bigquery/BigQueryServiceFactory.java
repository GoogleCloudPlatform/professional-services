/*
 * Copyright 2022 Google
 * This software is provided as-is, without warranty or representation for any use or purpose. 
 * Your use of it is subject to your agreement with Google.
 */

package com.google.cloud.pso.bqexternalviewgenerator.bigquery;

import static org.apache.commons.lang3.StringUtils.isNotBlank;

import com.google.auth.oauth2.GoogleCredentials;
import com.google.auth.oauth2.ServiceAccountCredentials;
import com.google.cloud.bigquery.BigQuery;
import com.google.cloud.bigquery.BigQueryOptions;
import com.google.cloud.pso.bqexternalviewgenerator.config.ViewGeneratorProperties;
import java.io.File;
import java.io.FileInputStream;
import java.io.IOException;
import lombok.extern.log4j.Log4j2;

@Log4j2
public class BigQueryServiceFactory {
  ViewGeneratorProperties configs;

  public BigQueryServiceFactory(ViewGeneratorProperties configs) {
    this.configs = configs;
  }

  public BigQuery getService() throws IOException {
    return (isNotBlank(configs.bigquery.serviceAccountKeyFile))
        ? getServiceByConfigCredentials()
        : getServiceByApplicationDefaultCredentials();
  }

  private BigQuery getServiceByConfigCredentials() throws IOException {
    log.info(
        String.format(
            "Creating a BigqueryClient using service account key file provided: %s",
            configs.bigquery.serviceAccountKeyFile));
    File credentialsPath = new File(configs.bigquery.serviceAccountKeyFile);

    // Load credentials from JSON key file. If you can't set the GOOGLE_APPLICATION_CREDENTIALS
    // environment variable, you can explicitly load the credentials file to construct the
    // credentials.
    GoogleCredentials credentials;
    try (FileInputStream serviceAccountStream = new FileInputStream(credentialsPath)) {
      credentials = ServiceAccountCredentials.fromStream(serviceAccountStream);
    }

    // Instantiate a client.
    return BigQueryOptions.newBuilder()
        .setCredentials(credentials)
        .setProjectId(configs.bigquery.project)
        .build()
        .getService();
  }

  // Ref: https://cloud.google.com/docs/authentication/production
  // https://cloud.google.com/bigquery/docs/authentication/getting-started#application_default_credentials
  private BigQuery getServiceByApplicationDefaultCredentials() {
    return BigQueryOptions.getDefaultInstance().getService();
  }
}
