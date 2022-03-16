/**
 * Copyright 2022 Google LLC
 *
 * <p>Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file
 * except in compliance with the License. You may obtain a copy of the License at
 *
 * <p>http://www.apache.org/licenses/LICENSE-2.0
 *
 * <p>Unless required by applicable law or agreed to in writing, software distributed under the
 * License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either
 * express or implied. See the License for the specific language governing permissions and
 * limitations under the License.
 */
package com.example.dfdl;

import com.google.cloud.bigtable.admin.v2.BigtableTableAdminClient;
import com.google.cloud.bigtable.admin.v2.BigtableTableAdminSettings;
import com.google.cloud.bigtable.data.v2.BigtableDataClient;
import com.google.cloud.bigtable.data.v2.BigtableDataSettings;
import java.io.IOException;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.ApplicationRunner;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.Bean;
import org.springframework.core.env.Environment;

@SpringBootApplication
public class BigtableServer {

  @Value("${spring.cloud.gcp.project-id}") String projectId;
  @Value("${bigtable.instance-id}") String instanceId;
  @Value("${bigtable.table-id}") String tableId;

  @Bean
  ApplicationRunner bigtableServerApplicationRunner(Environment environment) {
    return args -> {
      System.out.println("Content of application.properties: "
          + "instance-id="
          + environment.getProperty("bigtable.instance-id")
          + " table-id="
          + environment.getProperty("bigtable.table-id"));
    };
  }

  @Bean
  public BigtableDataSettings getBigtableDataSetting() {
    return BigtableDataSettings.newBuilder()
        .setProjectId(projectId)
        .setInstanceId(instanceId).build();
  }

  @Bean
  public BigtableDataClient getBigtableClient(BigtableDataSettings bigtableDataSettings)
      throws IOException {
    return BigtableDataClient.create(bigtableDataSettings);
  }

  @Bean
  public BigtableTableAdminSettings getBigtableAdminSettings()
      throws IOException {
    return BigtableTableAdminSettings.newBuilder()
        .setProjectId(projectId)
        .setInstanceId(instanceId)
        .build();
  }

  @Bean
  public BigtableTableAdminClient getBigtableAdminClient(
      BigtableTableAdminSettings bigtableTableAdminSettings) throws IOException {
     return BigtableTableAdminClient.create(bigtableTableAdminSettings);
  }

  @Bean
  public String getTableId() {
    return tableId;
  }
}