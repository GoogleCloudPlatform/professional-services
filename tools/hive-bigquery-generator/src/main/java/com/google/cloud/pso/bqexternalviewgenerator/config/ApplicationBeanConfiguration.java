/*
 * Copyright 2022 Google
 * This software is provided as-is, without warranty or representation for any use or purpose. 
 * Your use of it is subject to your agreement with Google.
 */

package com.google.cloud.pso.bqexternalviewgenerator.config;


import com.google.cloud.bigquery.BigQuery;
import com.google.cloud.pso.bqexternalviewgenerator.bigquery.BigQueryServiceFactory;
import java.io.IOException;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
@EnableConfigurationProperties(ViewGeneratorProperties.class)
public class ApplicationBeanConfiguration {

  @Bean
  public BigQuery bigqueryClient(ViewGeneratorProperties configs) throws IOException {
    return new BigQueryServiceFactory(configs).getService();
  }
}
