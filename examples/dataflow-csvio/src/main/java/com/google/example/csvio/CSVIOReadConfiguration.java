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
import java.io.Serializable;
import java.util.Optional;
import javax.annotation.Nullable;

/** Configuration for reading CSV files used in combination with {@link CSVIO.Read}. */
@AutoValue
public abstract class CSVIOReadConfiguration implements Serializable {

  public static Builder builder() {
    return new AutoValue_CSVIOReadConfiguration.Builder();
  }

  /** The source file path blob pattern for the CSV files. */
  public abstract String getFilePattern();

  /** The expected header position line number. Defaults to finding the first non-empty line. */
  @Nullable
  public abstract Long getHeaderPosition();

  /** The header regular expression to match when finding the header line. */
  @Nullable
  public abstract String getHeaderMatchRegex();

  @AutoValue.Builder
  public abstract static class Builder {

    public abstract Builder setFilePattern(String value);

    public abstract Builder setHeaderPosition(Long value);

    abstract Optional<Long> getHeaderPosition();

    public abstract Builder setHeaderMatchRegex(String value);

    abstract Optional<String> getHeaderMatchRegex();

    public abstract CSVIOReadConfiguration autoBuild();

    public final CSVIOReadConfiguration build() {
      if (getHeaderPosition().isPresent() && getHeaderMatchRegex().isPresent()) {
        throw new IllegalArgumentException(
            "cannot set both header position and header match regex");
      }
      if (getHeaderPosition().isPresent() && getHeaderPosition().get() < 0) {
        throw new IllegalArgumentException("header position must be >= 0");
      }
      if (getHeaderMatchRegex().isPresent() && getHeaderMatchRegex().get().isEmpty()) {
        throw new IllegalArgumentException(
            "configured header match regex cannot be an empty string");
      }

      return autoBuild();
    }
  }
}
