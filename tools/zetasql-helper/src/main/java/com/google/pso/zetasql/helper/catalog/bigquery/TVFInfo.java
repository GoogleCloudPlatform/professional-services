package com.google.pso.zetasql.helper.catalog.bigquery;

import com.google.common.collect.ImmutableList;
import com.google.zetasql.FunctionSignature;
import com.google.zetasql.TVFRelation;

public class TVFInfo {

  private final ImmutableList<String> namePath;

  private final FunctionSignature signature;

  private final TVFRelation outputSchema;

  public TVFInfo(
      ImmutableList<String> namePath,
      FunctionSignature signature,
      TVFRelation outputSchema
  ) {
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
