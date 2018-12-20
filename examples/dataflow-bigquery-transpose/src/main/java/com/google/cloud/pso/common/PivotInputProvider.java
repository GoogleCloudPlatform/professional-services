/*
 * Copyright (C) 2018 Google Inc.
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

package com.google.cloud.pso.common;

import static com.google.common.base.Preconditions.checkArgument;
import static com.google.common.base.Preconditions.checkNotNull;

import com.google.auto.value.AutoValue;
import com.google.cloud.bigquery.Field;
import com.google.cloud.bigquery.Schema;
import com.google.cloud.bigquery.StandardSQLTypeName;
import com.google.common.collect.ImmutableSet;
import com.google.common.collect.Lists;
import com.google.common.collect.Sets;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

/**
 * Helper class to validate the input {@link Schema} field with the list of pivot, key and value
 * fields.
 */
@AutoValue
public abstract class PivotInputProvider {

  private static final Set<StandardSQLTypeName> ALLOWED_PIVOT_TYPES =
      ImmutableSet.of(StandardSQLTypeName.BOOL, StandardSQLTypeName.STRING);

  public static Builder newBuilder() {
    return new AutoValue_PivotInputProvider.Builder();
  }

  abstract Schema inputTableSchema();

  abstract List<String> keyFieldNames();

  public abstract Schema keyFieldSchema();

  abstract List<String> pivotFieldNames();

  public abstract Schema pivotFieldSchema();

  abstract List<String> valueFieldNames();

  public abstract Schema valueFieldSchema();

  public abstract Schema nonKeySchema();

  @AutoValue.Builder
  public abstract static class Builder {

    Map<String, Field> fieldNameToFieldMap;

    abstract Builder setInputTableSchema(Schema pivotFieldsSchema);

    abstract Schema inputTableSchema();

    abstract Builder setKeyFieldNames(List<String> keyFieldNames);

    abstract List<String> keyFieldNames();

    abstract Builder setPivotFieldNames(List<String> pivotFieldnames);

    abstract List<String> pivotFieldNames();

    abstract Builder setValueFieldNames(List<String> valueFieldNames);

    abstract List<String> valueFieldNames();

    abstract Builder setPivotFieldSchema(Schema pivotFieldSchema);

    abstract Builder setValueFieldSchema(Schema valueFieldSchema);

    abstract Builder setKeyFieldSchema(Schema keyFieldSchema);

    abstract Builder setNonKeySchema(Schema nonKeySchema);

    abstract PivotInputProvider autoBuild();

    /**
     * Builder helper to provide {@link Schema}.
     *
     * @param inputTableSchema {@link Schema} for input table.
     * @return {@link Builder}
     */
    public Builder withInputTableSchema(Schema inputTableSchema) {
      checkArgument(
          inputTableSchema != null,
          "withInputTableSchema(inputTableSchema) called with null value.");
      return setInputTableSchema(inputTableSchema);
    }

    /**
     * Builder helper to provide keyFieldNames.
     *
     * @param keyFieldNames {@link List<String>} of input keyFieldName.
     * @return {@link Builder}
     */
    public Builder withKeyFieldNames(List<String> keyFieldNames) {
      checkArgument(
          keyFieldNames != null, "withKeyFieldNames(keyFieldNames) called with null input");
      checkArgument(
          keyFieldNames.size() > 0, "withKeyFieldNames(keyFieldNames) called with empty input");
      return setKeyFieldNames(keyFieldNames);
    }

    /**
     * Builder helper to provide {@link List<String>} pivotFieldNames.
     *
     * @param pivotFieldNames {@link List<String>} of input pivotFieldNames.
     * @return {@link Builder}
     */
    public Builder withPivotFieldNames(List<String> pivotFieldNames) {
      checkArgument(
          pivotFieldNames != null, "withPivotFieldNames(pivotFieldNames) called with null input");
      checkArgument(
          pivotFieldNames.size() > 0,
          "withPivotFieldNames(pivotFieldNames) called with empty input");
      return setPivotFieldNames(pivotFieldNames);
    }

    /**
     * Builder helper to provide {@link List<String>} valueFieldNames.
     *
     * @param valueFieldNames {@link List<String>} of input valueFieldNames.
     * @return {@link Builder}
     */
    public Builder withValueFieldNames(List<String> valueFieldNames) {
      checkArgument(
          valueFieldNames != null, "withValueFieldNames(valueFieldNames) called with null input");
      checkArgument(
          valueFieldNames.size() > 0,
          "withValueFieldNames(valueFieldNames) called with empty input");
      return setValueFieldNames(valueFieldNames);
    }

    /**
     * Builds and returns a {@link PivotInputProvider} object.
     *
     * @return {@link PivotInputProvider} object.
     */
    public PivotInputProvider build() {
      checkArgument(inputTableSchema() != null, "inputTableSchema is missing.");
      checkArgument(keyFieldNames() != null, "keyFieldNames is missing.");
      checkArgument(valueFieldNames() != null, "valueFieldNames is missing.");

      // Validate whether the field names are present in the Schema
      validateFields(keyFieldNames());
      validateFields(pivotFieldNames());
      validateFields(valueFieldNames());

      // Validate whether the pivot field types are valid.
      validatePivotFieldType();

      Builder builder =
          this.setKeyFieldSchema(extractSchema(keyFieldNames()))
              .setPivotFieldSchema(extractSchema(pivotFieldNames()))
              .setValueFieldSchema(extractSchema(valueFieldNames()));

      Set<String> keyFieldNamesSet = Sets.newHashSet(keyFieldNames());
      List<String> nonKeyFieldNames =
          inputTableSchema()
              .getFields()
              .stream()
              .map(Field::getName)
              .filter(name -> !keyFieldNamesSet.contains(name))
              .collect(Collectors.toList());

      builder = builder.setNonKeySchema(extractSchema(nonKeyFieldNames));

      return builder.autoBuild();
    }

    /** Validates that {@link List<String>} fieldnames is present in the {@link Schema}. */
    private void validateFields(List<String> fieldNames) {
      populateFieldNameToFieldMap();
      Set<String> validFieldNames = fieldNameToFieldMap.keySet();

      for (String fieldName : fieldNames) {
        if (!validFieldNames.contains(fieldName)) {
          throw new IllegalArgumentException(
              "Invalid field name: " + fieldName + " in: " + inputTableSchema().toString());
        }
      }
    }

    /**
     * Extract {@link Schema} from the input table {@link Schema} based on {@link List<String>}
     * fieldNames.
     */
    private Schema extractSchema(List<String> fields) {
      List<Field> extractedFields = Lists.newArrayListWithCapacity(fields.size());
      populateFieldNameToFieldMap();

      fields.forEach(field -> extractedFields.add(fieldNameToFieldMap.get(field)));

      return Schema.of(extractedFields);
    }

    /** Validate that the pivot fields have the right {@link StandardSQLTypeName}. */
    private void validatePivotFieldType() {
      populateFieldNameToFieldMap();

      for (String fieldName : pivotFieldNames()) {
        checkArgument(
            isValidPivotType(fieldName),
            "Unsupported pivot type: "
                + fieldNameToFieldMap.get(fieldName).getType().getStandardType()
                + " for field: "
                + fieldName);

        checkArgument(
            !isModeRepeated(fieldName),
            "Unsupported pivot mode: " + Field.Mode.REPEATED.name() + " for field: " + fieldName);
      }
    }

    /**
     * Check if the {@link StandardSQLTypeName} corresponding to the fieldName is an allowed pivot
     * type.
     *
     * @param fieldName field name to check the type for.
     * @return true if the type is an allowed type, false otherwise.
     */
    private boolean isValidPivotType(String fieldName) {
      checkNotNull(fieldName, "isValidPivotType(fieldName) called with null value.");
      return ALLOWED_PIVOT_TYPES.contains(
          fieldNameToFieldMap.get(fieldName).getType().getStandardType());
    }

    /**
     * Check if the {@link Field.Mode} corresponding to the fieldName is REPEATED.
     *
     * @param fieldName field name to check the mode for.
     * @return true if the mode is REPEATED.
     */
    private boolean isModeRepeated(String fieldName) {
      checkNotNull(fieldName, "isValidPivotMode(fieldName) called with null value.");
      return fieldNameToFieldMap.get(fieldName).getMode() != null
          && fieldNameToFieldMap.get(fieldName).getMode().equals(Field.Mode.REPEATED);
    }

    /** Generate a map of fieldNames to Field for validation. */
    private void populateFieldNameToFieldMap() {
      if (fieldNameToFieldMap == null) {
        fieldNameToFieldMap =
            inputTableSchema()
                .getFields()
                .stream()
                .collect(Collectors.toMap(Field::getName, f -> f));
      }
    }
  }
}
