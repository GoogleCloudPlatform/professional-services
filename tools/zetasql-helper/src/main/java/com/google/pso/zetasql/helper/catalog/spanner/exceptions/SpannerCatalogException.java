package com.google.pso.zetasql.helper.catalog.spanner.exceptions;

import com.google.pso.zetasql.helper.catalog.exceptions.CatalogException;

public class SpannerCatalogException extends CatalogException {

  public SpannerCatalogException(String message) {
    super(message);
  }

}
