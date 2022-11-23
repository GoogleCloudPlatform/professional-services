/*
 * Copyright 2022 Google LLC All Rights Reserved
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
package com.google.pso.zetasql.helper.catalog.bigquery;

import java.util.regex.Matcher;
import java.util.regex.Pattern;

// Utility class to parse a table reference into a TableId object
public class BigQueryReferenceParser {

  private static final String PROJECT_ID_TAG = "projectId";
  private static final String DATASET_ID_TAG = "dataset";
  private static final String RESOURCE_ID_TAG = "resource";

  private static final String PROJECT_PATTERN = "[a-zA-Z0-9\\.\\-\\:]+";
  private static final String DATASET_PATTERN = "[a-zA-Z_][a-zA-Z0-9\\_]+";
  private static final String RESOURCE_PATTERN = "[a-zA-Z0-9\\_]+";

  private static final String BQ_QUALIFIED_RESOURCE_WITHOUT_PROJECT =
      String.format(
          "^(?<%s>%s)\\.(?<%s>%s)$", DATASET_ID_TAG, DATASET_PATTERN, RESOURCE_ID_TAG,
          RESOURCE_PATTERN);

  private static final String BQ_QUALIFIED_RESOURCE_WITH_PROJECT =
      String.format(
          "^(?<%s>%s)[:\\.](?<%s>%s)\\.(?<%s>%s)$",
          PROJECT_ID_TAG,
          PROJECT_PATTERN,
          DATASET_ID_TAG,
          DATASET_PATTERN,
          RESOURCE_ID_TAG,
          RESOURCE_PATTERN);

  private BigQueryReferenceParser() { }

  // Parses a resource reference with the format "project.dataset.table"
  // and returns the TableId.
  private static BigQueryReference parseFullReference(String reference) {
    Matcher matcher = Pattern.compile(BQ_QUALIFIED_RESOURCE_WITH_PROJECT).matcher(reference);

    if (!matcher.find()) {
      throw new InvalidBigQueryReference(reference);
    }

    return new BigQueryReference(
        matcher.group(PROJECT_ID_TAG),
        matcher.group(DATASET_ID_TAG),
        matcher.group(RESOURCE_ID_TAG)
    );

  }

  // Parses a resource reference with the format "dataset.table", the project needs to be provided.
  // Returns the TableId.
  private static BigQueryReference parseReferenceWithoutProject(String projectId, String reference) {
    Matcher matcher = Pattern.compile(BQ_QUALIFIED_RESOURCE_WITHOUT_PROJECT).matcher(reference);

    if (!matcher.find()) {
      throw new InvalidBigQueryReference(reference);
    }

    return new BigQueryReference(
        projectId,
        matcher.group(DATASET_ID_TAG),
        matcher.group(RESOURCE_ID_TAG)
    );
  }

  public static BigQueryReference parseReference(String projectId, String reference) {
    if (matchesPattern(reference, BQ_QUALIFIED_RESOURCE_WITH_PROJECT)) {
      return parseFullReference(reference);
    } else if (matchesPattern(reference, BQ_QUALIFIED_RESOURCE_WITHOUT_PROJECT)) {
      return parseReferenceWithoutProject(projectId, reference);
    }

    throw new InvalidBigQueryReference(reference);
  }

  private static boolean matchesPattern(String s, String pattern) {
    return Pattern.compile(pattern).matcher(s).matches();
  }

  public static boolean isValidReference(String reference) {
    return matchesPattern(reference, BQ_QUALIFIED_RESOURCE_WITH_PROJECT)
        ||
        matchesPattern(reference, BQ_QUALIFIED_RESOURCE_WITHOUT_PROJECT);
  }


}
