/*
 * Copyright 2022 Google
 * This software is provided as-is, without warranty or representation for any use or purpose. 
 * Your use of it is subject to your agreement with Google.
 */

package com.google.cloud.pso.bqexternalviewgenerator.common;

import static org.apache.commons.lang3.StringUtils.isNotBlank;

import com.google.common.collect.ImmutableList;
import java.util.List;
import java.util.Optional;

public class FieldInfo {
  public String name;
  public String type;
  public String fullName;
  public boolean repeated;
  public ImmutableList<FieldInfo> fields;

  public FieldInfo(
      String name,
      String type,
      String fullName,
      boolean repeated,
      ImmutableList<FieldInfo> fields) {
    this.name = name;
    this.type = type;
    this.fullName = fullName;
    this.repeated = repeated;
    this.fields = fields;
  }

  public String quotedName() {
    return "`" + name + "`";
  }

  public static FieldInfo simple(String name, String type) {
    return simple(name, type, name);
  }

  public static FieldInfo simple(String name, String type, String fullName) {
    return new FieldInfo(name, type, fullName, false, ImmutableList.of());
  }

  public FieldInfo withFields(List<FieldInfo> fields) {
    return new FieldInfo(name, type, fullName, repeated, ImmutableList.copyOf(fields));
  }

  public FieldInfo asRepeated() {
    return new FieldInfo(name, type, fullName, true, fields);
  }

  public FieldInfo withoutRepeat() {
    return new FieldInfo(name, type, fullName, false, fields);
  }

  public FieldInfo aliasAsTopField(String newName) {
    return aliasAs(newName, "");
  }

  public FieldInfo withNewParent(String newParentPath) {
    String updatedFullName = makeFullName(name, newParentPath);

    ImmutableList<FieldInfo> updatedFields =
        fields.stream()
            .map(field -> field.withNewParent(updatedFullName))
            .collect(ImmutableList.toImmutableList());

    return new FieldInfo(name, type, updatedFullName, repeated, updatedFields);
  }

  public FieldInfo aliasAs(String newName, String newParent) {
    return new FieldInfo(newName, type, fullName, repeated, fields).withNewParent(newParent);
  }

  private static String makeFullName(String name, String parentPath) {
    return String.format(
        "%s%s`%s`",
        Optional.ofNullable(parentPath).orElse(""), (isNotBlank(parentPath) ? "." : ""), name);
  }

  @Override
  public String toString() {
    return "FieldInfo{"
        + "name='"
        + name
        + '\''
        + ", type='"
        + type
        + '\''
        + ", fullName='"
        + fullName
        + '\''
        + ", repeated="
        + repeated
        + ", fields="
        + fields
        + '}';
  }
}
