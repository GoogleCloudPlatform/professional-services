package com.google.pso.zetasql.helper.catalog.typeparser;

public class ZetaSQLTypeParseError extends RuntimeException {

  public ZetaSQLTypeParseError(String message, Throwable cause) {
    super(message, cause);
  }

}
