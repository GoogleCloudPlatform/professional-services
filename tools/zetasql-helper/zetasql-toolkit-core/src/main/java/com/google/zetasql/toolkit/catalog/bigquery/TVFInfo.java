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

import com.google.common.collect.ImmutableList;
import com.google.zetasql.FunctionSignature;
import com.google.zetasql.TVFRelation;
import com.google.zetasql.TableValuedFunction;

/**
 * Dataclass containing the fields of a ZetaSQL TableValuedFunction
 *
 * <p>This is necessary because the ZetaSQL TableValuedFunction class does not currently implement a
 * getOutputSchema() method.
 *
 * @see TableValuedFunction
 */
public class TVFInfo {

  private final ImmutableList<String> namePath;

  private final FunctionSignature signature;

  private final TVFRelation outputSchema;

  public TVFInfo(
      ImmutableList<String> namePath, FunctionSignature signature, TVFRelation outputSchema) {
    this.namePath = namePath;
    this.signature = signature;
    this.outputSchema = outputSchema;
  }

  public ImmutableList<String> getNamePath() {
    return namePath;
  }

  public FunctionSignature getSignature() {
    return signature;
  }

  public TVFRelation getOutputSchema() {
    return outputSchema;
  }
}
