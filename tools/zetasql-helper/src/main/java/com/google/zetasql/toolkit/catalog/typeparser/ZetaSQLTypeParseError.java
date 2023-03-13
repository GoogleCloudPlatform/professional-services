package com.google.zetasql.toolkit.catalog.typeparser;

public class ZetaSQLTypeParseError extends RuntimeException {

  public ZetaSQLTypeParseError(String message, Throwable cause) {
    super(message, cause);
  }

}
