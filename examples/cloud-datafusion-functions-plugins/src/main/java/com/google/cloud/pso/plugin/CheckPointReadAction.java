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

import com.google.cloud.pso.common.GCPConfig;
import com.google.cloud.pso.functions.CheckPointReadFunction;
import io.cdap.cdap.api.TxRunnable;
import io.cdap.cdap.api.annotation.Description;
import io.cdap.cdap.api.annotation.Macro;
import io.cdap.cdap.api.annotation.Name;
import io.cdap.cdap.api.annotation.Plugin;
import io.cdap.cdap.api.data.DatasetContext;
import io.cdap.cdap.etl.api.action.Action;
import io.cdap.cdap.etl.api.action.ActionContext;
import java.io.IOException;
import java.text.ParseException;
import java.util.concurrent.ExecutionException;
import javax.annotation.Nullable;

/** An Action Plugin to read checkpoints stored in Firestore. */
@Plugin(type = Action.PLUGIN_TYPE)
@Name(CheckPointReadAction.NAME)
@Description("Reads the checkpoint details for a given table")
public class CheckPointReadAction extends Action {
  public static final String NAME = "CheckPointReadAction";
  private final Conf config;

  public CheckPointReadAction(Conf config) {
    this.config = config;
  }

  @Override
  public void run(ActionContext context) throws Exception {
    context.execute(
        new TxRunnable() {
          @Override
          public void run(DatasetContext datasetContext)
              throws IOException, ExecutionException, InterruptedException, ParseException,
                  Exception {
            new CheckPointReadFunction()
                .execute(
                    context,
                    config.getServiceAccountFilePath(),
                    config.getProject(),
                    config.collectionName,
                    config.documentName,
                    config.bufferTime);
          }
        });
  }

  public static class Conf extends GCPConfig {
    private static final long serialVersionUID = 3838144048142671294L;

    @Description("Specify the collection name in firestore DB")
    @Macro
    private String collectionName;

    @Description("Specify the document name to read the checkpoint details")
    @Macro
    private String documentName;

    @Description("Buffer time to add to watermark value")
    @Macro
    @Nullable
    private String bufferTime;
  }
}
