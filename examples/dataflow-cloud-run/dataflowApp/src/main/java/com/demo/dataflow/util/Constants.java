/*
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
package com.demo.dataflow.util;

import com.google.api.services.bigquery.model.TableFieldSchema;
import com.google.api.services.bigquery.model.TableSchema;
import com.google.common.collect.ImmutableList;

public class Constants {

    public static final String STRING = "STRING";
    public static final String NUMERIC = "NUMERIC";
    public static final String FLOAT = "FLOAT";
    public static final String INTEGER = "INTEGER";
    public static final String  GEOGRAPHY="GEOGRAPHY";


    public static final  TableSchema errorTableSchema =
            new TableSchema().setFields(ImmutableList.of(
                    new TableFieldSchema().setName("error_timestamp").setType(Constants.NUMERIC),
                    new TableFieldSchema().setName("error_message").setType(Constants.STRING),
                    new TableFieldSchema().setName("data_string").setType(Constants.STRING),
                    new TableFieldSchema().setName("correlation_id").setType(Constants.STRING)));
}
