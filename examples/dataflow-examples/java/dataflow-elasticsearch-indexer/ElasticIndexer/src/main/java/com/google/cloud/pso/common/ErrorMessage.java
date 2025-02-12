/*
 * Copyright (C) 2018 Google Inc.
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

package com.google.cloud.pso.common;

import static com.google.common.base.Preconditions.checkArgument;

import com.google.auto.value.AutoValue;
import javax.annotation.Nullable;

/**
 * A class to hold messages that fail validation either because the json is not well formed or
 * because the key element required to be present within the json is missing. The class encapsulates
 * the original payload in addition to a error message and an optional stack trace to help with
 * identifying the root cause in a subsequent reprocessing attempt/debugging.
 */
@AutoValue
public abstract class ErrorMessage {
  public static Builder newBuilder() {
    return new AutoValue_ErrorMessage.Builder();
  }

  public abstract String jsonPayload();

  public abstract String errorMessage();

  @Nullable
  public abstract String errorStackTrace();

  @AutoValue.Builder
  public abstract static class Builder {
    abstract Builder setJsonPayload(String jsonPayload);

    abstract Builder setErrorMessage(String errorMessage);

    abstract Builder setErrorStackTrace(String errorStackTrace);

    public abstract ErrorMessage build();

    public Builder withJsonPayload(String jsonPayload) {
      checkArgument(jsonPayload != null, "withJsonPayload(jsonPayload) called with null value.");
      return setJsonPayload(jsonPayload);
    }

    public Builder withErrorMessage(String errorMessage) {
      checkArgument(errorMessage != null, "withErrorMessage(errorMessage) called with null value.");
      return setErrorMessage(errorMessage);
    }

    public Builder withErrorStackTrace(String errorStackTrace) {
      checkArgument(
          errorStackTrace != null, "withErrorStackTrace(errorStackTrace) called with null value.");
      return setErrorStackTrace(errorStackTrace);
    }
  }
}
