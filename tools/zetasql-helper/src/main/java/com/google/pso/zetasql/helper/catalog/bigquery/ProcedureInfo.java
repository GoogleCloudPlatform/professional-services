package com.google.pso.zetasql.helper.catalog.bigquery;

import com.google.common.collect.ImmutableList;
import com.google.zetasql.FunctionSignature;

public class ProcedureInfo {

  private final ImmutableList<String> namePath;

  private final FunctionSignature signature;

  public ProcedureInfo(ImmutableList<String> namePath, FunctionSignature signature) {
    this.namePath = namePath;
    this.signature = signature;
  }

  public ImmutableList<String> getNamePath() {
    return namePath;
  }

  public FunctionSignature getSignature() {
    return signature;
  }

}
