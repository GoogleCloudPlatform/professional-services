/*
 * Copyright 2021 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
package com.google.cloud.pso.plugin;

import com.google.cloud.pso.functions.TruncateTableFunction;
import io.cdap.cdap.api.TxRunnable;
import io.cdap.cdap.api.annotation.Description;
import io.cdap.cdap.api.annotation.Macro;
import io.cdap.cdap.api.annotation.Name;
import io.cdap.cdap.api.annotation.Plugin;
import io.cdap.cdap.api.data.DatasetContext;
import io.cdap.cdap.api.plugin.PluginConfig;
import io.cdap.cdap.etl.api.PipelineConfigurer;
import io.cdap.cdap.etl.api.action.Action;
import io.cdap.cdap.etl.api.action.ActionContext;
import org.apache.tephra.TransactionFailureException;

/** An Action Plugin to truncate the records in a BigQuery table. */
@Plugin(type = Action.PLUGIN_TYPE)
@Name(TruncateTableAction.NAME)
@Description("Truncate bigquery table")
public class TruncateTableAction extends Action {
  public static final String NAME = "TruncateTableAction";
  private final Conf config;

  public TruncateTableAction(Conf config) {
    this.config = config;
  }

  @Override
  public void configurePipeline(PipelineConfigurer pipelineConfigurer) {}

  @Override
  public void run(ActionContext context) throws TransactionFailureException {
    context.execute(
        new TxRunnable() {
          @Override
          public void run(DatasetContext context) {
            TruncateTableFunction.truncateTable(
                config.keyPath, config.projectId, config.dataset, config.tableName);
          }
        });
  }

  public static class Conf extends PluginConfig {
    @Name("keyPath")
    @Description("Path to credential key")
    @Macro
    private final String keyPath;

    @Name("projectId")
    @Description("Project Id")
    @Macro
    private final String projectId;

    @Name("tableName")
    @Description("Table name")
    @Macro
    private final String tableName;

    @Name("dataset")
    @Description("Dataset name")
    @Macro
    private final String dataset;

    public Conf(String keyPath, String projectId, String dataset, String tableName) {
      this.keyPath = keyPath;
      this.projectId = projectId;
      this.dataset = dataset;
      this.tableName = tableName;
    }
  }
}
