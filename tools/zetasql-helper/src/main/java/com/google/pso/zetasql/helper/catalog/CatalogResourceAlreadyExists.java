package com.google.pso.zetasql.helper.catalog;

public class CatalogResourceAlreadyExists extends RuntimeException {

  private final String resourceName;

  public CatalogResourceAlreadyExists(String resourceName) {
    super("Catalog resource already exists: " + resourceName);
    this.resourceName = resourceName;
  }

  public String getResourceName() {
    return resourceName;
  }

}
