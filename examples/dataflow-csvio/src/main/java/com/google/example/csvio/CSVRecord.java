/*
 * Copyright 2022 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     https://www.apache.org/licenses/LICENSE-2.0
 *
 *  Unless required by applicable law or agreed to in writing, software
 *  distributed under the License is distributed on an "AS IS" BASIS,
 *  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 *  See the License for the specific language governing permissions and
 *  limitations under the License.
 */

package com.google.example.csvio;

import com.google.auto.value.AutoValue;
import org.apache.beam.sdk.schemas.AutoValueSchema;
import org.apache.beam.sdk.schemas.annotations.DefaultSchema;

/**
 * The result of processing CSV files.
 */
@DefaultSchema(AutoValueSchema.class)
@AutoValue
public abstract class CSVRecord {

  /**
   * Instantiates a {@link Builder}.
   */
  public static Builder builder() {
    return new AutoValue_CSVRecord.Builder();
  }

  /**
   * The contextual header of the CSV record.
   */
  public abstract String getHeader();

  /**
   * The data of the CSV record.
   */
  public abstract String getRecord();

  /**
   * The original file from which the CSV record was parsed.
   */
  public abstract String getResourceId();

  /**
   * The contextual line number of the CSV record.
   */
  public abstract Long getLineNumber();

  @AutoValue.Builder
  public static abstract class Builder {

    /**
     * The contextual header of the CSV record.
     */
    public abstract Builder setHeader(String value);

    /**
     * The data of the CSV record.
     */
    public abstract Builder setRecord(String value);

    /**
     * The original file from which the CSV record was parsed.
     */
    public abstract Builder setResourceId(String value);

    /**
     * The contextual line number of the CSV record.
     */
    public abstract Builder setLineNumber(Long value);

    public abstract CSVRecord build();
  }
}
