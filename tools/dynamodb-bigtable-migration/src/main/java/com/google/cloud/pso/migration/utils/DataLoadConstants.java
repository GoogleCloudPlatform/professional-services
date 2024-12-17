/*
 *  Copyright 2024 Google LLC
 *
 *  Licensed under the Apache License, Version 2.0 (the "License");
 *  you may not use this file except in compliance with the License.
 *  You may obtain a copy of the License at
 *
 *      https://www.apache.org/licenses/LICENSE-2.0
 *
 *  Unless required by applicable law or agreed to in writing, software
 *  distributed under the License is distributed on an "AS IS" BASIS,
 *  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 *  See the License for the specific language governing permissions and
 *  limitations under the License.
 */
package com.google.cloud.pso.migration.utils;

/**
 * Contains constants representing field names used in data loading processes.These constants
 * provide a centralized location for managing field names,improving code readability and
 * maintainability.
 */
public class DataLoadConstants {
  public static class SchemaFields {
    public static final String ROW_KEY = "row_key";
    public static final String CELLS = "cells";
    public static final String COLUMN_FAMILY = "column_family";
    public static final String COLUMN = "column";
    public static final String PAYLOAD = "payload";
  }

  public static class DynamoDBFields {
    public static final String ITEMS = "Item";
  }
}
