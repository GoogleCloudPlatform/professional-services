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
import javax.annotation.Nullable;

/**
 * Configuration for reading CSV files used in combination with {@link CSVIO.Read}.
 */
@AutoValue
public abstract class CSVIOReadConfiguration implements Serializable {

    public static Builder builder() {
        return new AutoValue_CSVIOReadConfiguration.Builder();
    }

    /** The source file path blob pattern for the CSV files. */
    public abstract String getFilePattern();

    /** The expected header position line number.  Defaults to finding the first non-empty line. */
    @Nullable
    public abstract Long getHeaderPosition();

    /** The header regular expression to match when finding the header line. */
    @Nullable
    public abstract String getHeaderMatchRegex();

    void validate() {
        if (getHeaderPosition() != null && getHeaderMatchRegex() != null) {
            throw new IllegalArgumentException("cannot set both header position and header match regex");
        }
        if (getHeaderPosition() != null && getHeaderPosition() < 0) {
            throw new IllegalArgumentException("header position must be >= 0");
        }
        if (getHeaderMatchRegex() != null && getHeaderMatchRegex().isEmpty()) {
            throw new IllegalArgumentException("configured header match regex cannot be an empty string");
        }
    }

    @AutoValue.Builder
    public static abstract class Builder {

        public abstract Builder setFilePattern(String value);

        public abstract Builder setHeaderPosition(Long value);

        public abstract Builder setHeaderMatchRegex(String value);

        public abstract CSVIOReadConfiguration build();
    }
}
