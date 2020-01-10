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

import com.google.api.client.json.JsonParser;
import com.google.api.client.json.jackson2.JacksonFactory;
import com.google.api.services.bigquery.model.TableFieldSchema;
import com.google.api.services.bigquery.model.TableSchema;

import java.io.InputStream;
import java.util.ArrayList;
import java.util.List;

public class TableSchemaUtils {
    public static TableSchema readSchema(String fileName) throws Exception {
        InputStream ioStream = TableSchemaUtils.class.getResourceAsStream(fileName);
        List<TableFieldSchema> fields = new ArrayList<TableFieldSchema>();
        JsonParser parser = JacksonFactory.getDefaultInstance().createJsonParser(ioStream);
        parser.parseArrayAndClose(fields, TableFieldSchema.class);
        return new TableSchema().setFields(fields);
    }
}
