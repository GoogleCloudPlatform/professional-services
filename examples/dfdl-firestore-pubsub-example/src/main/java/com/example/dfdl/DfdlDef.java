package com.example.dfdl;

import com.google.cloud.firestore.annotation.DocumentId;
import com.google.cloud.spring.data.firestore.Document;

@Document(collectionName = "dfdl-schemas")
public class DfdlDef {
  @DocumentId
  String name;

  String definition;

  public DfdlDef() {}

  public DfdlDef(String name, String definition) {
    this.name = name;
    this.definition = definition;
  }

  public String getName() {
    return name;
  }

  public void setName(String name) {
    this.name = name;
  }

  public String getDefinition() {
    return definition;
  }

  public void setDefinition(String definition) {
    this.definition = definition;
  }
}