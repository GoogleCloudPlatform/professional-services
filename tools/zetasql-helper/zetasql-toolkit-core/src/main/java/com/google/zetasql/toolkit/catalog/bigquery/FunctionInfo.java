/*
 * Copyright 2023 Google LLC All Rights Reserved
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

package com.google.zetasql.toolkit.catalog.bigquery;

import com.google.zetasql.FunctionSignature;
import com.google.zetasql.ZetaSQLFunctions.FunctionEnums.Mode;
import java.util.List;
import java.util.Optional;

public class FunctionInfo {

  private final List<String> namePath;

  private final String group;

  private final Mode mode;

  private final List<FunctionSignature> signatures;

  private final Optional<BigQueryRoutineLanguage> language;

  private final Optional<String> body;

  private FunctionInfo(Builder builder) {
    this.namePath = builder.getNamePath();
    this.group = builder.getGroup();
    this.mode = builder.getMode();
    this.signatures = builder.getSignatures();
    this.language = builder.getLanguage();
    this.body = builder.getBody();
  }

  public List<String> getNamePath() {
    return namePath;
  }

  public String getGroup() {
    return group;
  }

  public Mode getMode() {
    return mode;
  }

  public List<FunctionSignature> getSignatures() {
    return signatures;
  }

  public Optional<BigQueryRoutineLanguage> getLanguage() {
    return language;
  }

  public Optional<String> getBody() {
    return this.body;
  }

  public Builder toBuilder() {
    return newBuilder()
        .setNamePath(this.namePath)
        .setGroup(this.group)
        .setMode(this.mode)
        .setSignatures(this.signatures)
        .setLanguage(this.language)
        .setBody(this.body);
  }

  public static Builder newBuilder() {
    return new Builder();
  }

  public static class Builder {
    private List<String> namePath;
    private String group;
    private Mode mode;
    private List<FunctionSignature> signatures;
    private Optional<BigQueryRoutineLanguage> language;
    private Optional<String> body;

    public Builder setNamePath(List<String> namePath) {
      this.namePath = namePath;
      return this;
    }

    public Builder setGroup(String group) {
      this.group = group;
      return this;
    }

    public Builder setMode(Mode mode) {
      this.mode = mode;
      return this;
    }

    public Builder setSignatures(List<FunctionSignature> signatures) {
      this.signatures = signatures;
      return this;
    }

    public Builder setLanguage(BigQueryRoutineLanguage language) {
      this.language = Optional.ofNullable(language);
      return this;
    }

    public Builder setLanguage(Optional<BigQueryRoutineLanguage> language) {
      this.language = language;
      return this;
    }

    public Builder setBody(String body) {
      this.body = Optional.ofNullable(body);
      return this;
    }

    public Builder setBody(Optional<String> body) {
      this.body = body;
      return this;
    }

    public List<String> getNamePath() {
      return namePath;
    }

    public String getGroup() {
      return group;
    }

    public Mode getMode() {
      return mode;
    }

    public List<FunctionSignature> getSignatures() {
      return signatures;
    }

    public Optional<BigQueryRoutineLanguage> getLanguage() {
      return language;
    }

    public Optional<String> getBody() {
      return body;
    }

    public FunctionInfo build() {
      return new FunctionInfo(this);
    }
  }
}
