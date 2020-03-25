/*
 * Copyright (C) 2020 Google Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not
 * use this file except in compliance with the License. You may obtain a copy of
 * the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS, WITHOUT
 * WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the
 * License for the specific language governing permissions and limitations under
 * the License.
 */

package util;

import com.google.cloud.bigquery.BigQuery;
import com.google.cloud.bigquery.BigQueryOptions;
import com.google.cloud.bigquery.FieldValueList;
import com.google.cloud.bigquery.QueryJobConfiguration;
import java.util.logging.Logger;

public class BQUtils {
  private static final BigQuery bigquery = BigQueryOptions.getDefaultInstance().getService();
  private static final Logger LOGGER = Logger.getLogger(BQUtils.class.getName());

  public static Iterable<FieldValueList> getResult(String query) throws Exception {
    LOGGER.info(String.format("Query to execute %s ", query));
    QueryJobConfiguration queryConfig = QueryJobConfiguration.newBuilder(query).build();
    return bigquery.query(queryConfig).iterateAll();
  }
}
