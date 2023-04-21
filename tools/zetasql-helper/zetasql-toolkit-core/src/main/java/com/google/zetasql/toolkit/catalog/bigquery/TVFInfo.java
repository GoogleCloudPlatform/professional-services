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

import com.google.common.base.Preconditions;
import com.google.common.collect.ImmutableList;
import com.google.zetasql.FunctionArgumentType;
import com.google.zetasql.FunctionArgumentType.FunctionArgumentTypeOptions;
import com.google.zetasql.FunctionSignature;
import com.google.zetasql.TVFRelation;
import com.google.zetasql.ZetaSQLFunctions.SignatureArgumentKind;
import java.util.Optional;

public class TVFInfo {

  private final ImmutableList<String> namePath;

  private final FunctionSignature signature;

  private final Optional<TVFRelation> outputSchema;

  private final Optional<String> body;

  private TVFInfo(Builder builder) {
    this.namePath = builder.getNamePath();
    this.signature = builder.getSignature();
    this.outputSchema = builder.getOutputSchema();
    this.body = builder.getBody();
  }

  public ImmutableList<String> getNamePath() {
    return namePath;
  }

  public FunctionSignature getSignature() {
    return signature;
  }

  public Optional<TVFRelation> getOutputSchema() {
    return outputSchema;
  }

  public Optional<String> getBody() {
    return body;
  }

  public Builder toBuilder() {
    return newBuilder()
        .setNamePath(this.namePath)
        .setSignature(this.signature)
        .setOutputSchema(this.outputSchema)
        .setBody(this.body);
  }

  public static Builder newBuilder() {
    return new Builder();
  }

  public static class Builder {

    private ImmutableList<String> namePath;

    private FunctionSignature signature;

    private Optional<TVFRelation> outputSchema;

    private Optional<String> body;

    public Builder setNamePath(ImmutableList<String> namePath) {
      this.namePath = namePath;
      return this;
    }

    public Builder setSignature(FunctionSignature signature) {
      this.signature = signature;
      return this;
    }

    public Builder setOutputSchema(TVFRelation outputSchema) {
      this.outputSchema = Optional.ofNullable(outputSchema);
      return this;
    }

    public Builder setOutputSchema(Optional<TVFRelation> outputSchema) {
      this.outputSchema = outputSchema;
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

    public ImmutableList<String> getNamePath() {
      return namePath;
    }

    public FunctionSignature getSignature() {
      return signature;
    }

    public Optional<TVFRelation> getOutputSchema() {
      return outputSchema;
    }

    public Optional<String> getBody() {
      return body;
    }

    private void validate() {
      Preconditions.checkNotNull(this.namePath, "Cannot build TVFInfo with null name path");
      Preconditions.checkArgument(!this.namePath.isEmpty(), "TVFInfo name path cannot be empty");
      Preconditions.checkNotNull(this.signature, "Cannot build TVFInfo with a null signature");
      Preconditions.checkArgument(
          this.signature.getResultType().getKind().equals(SignatureArgumentKind.ARG_TYPE_RELATION),
          "TVF result types must be of type RELATION");

      if (this.outputSchema.isPresent()) {
        // Make sure the RelationInputSchema is set on the function signature's return type
        FunctionArgumentTypeOptions newReturnTypeOptions =
            FunctionArgumentTypeOptions.builder()
                .setRelationInputSchema(this.outputSchema.get())
                .build();

        FunctionArgumentType newReturnType =
            new FunctionArgumentType(
                SignatureArgumentKind.ARG_TYPE_RELATION, newReturnTypeOptions, 1);

        FunctionSignature newSignature =
            new FunctionSignature(
                newReturnType,
                this.signature.getFunctionArgumentList(),
                this.signature.getContextId());

        this.setSignature(newSignature);
      }
    }

    public TVFInfo build() {
      this.validate();
      return new TVFInfo(this);
    }
  }
}
