package com.google.pso.zetasql.helper.catalog.exceptions;

public class CatalogResourceAlreadyExists extends CatalogException {

  private final String resourceName;

  public CatalogResourceAlreadyExists(String resourceName) {
    super("Catalog resource already exists: " + resourceName);
    this.resourceName = resourceName;
  }

  public String getResourceName() {
    return resourceName;
  }

}
