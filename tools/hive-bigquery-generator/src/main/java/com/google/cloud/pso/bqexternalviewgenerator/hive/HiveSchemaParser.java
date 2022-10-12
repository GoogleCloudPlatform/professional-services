/*
 * Copyright 2022 Google
 * This software is provided as-is, without warranty or representation for any use or purpose. 
 * Your use of it is subject to your agreement with Google.
 */

package com.google.cloud.pso.bqexternalviewgenerator.hive;


import com.google.cloud.bigquery.StandardSQLTypeName;
import com.google.cloud.pso.bqexternalviewgenerator.common.FieldInfo;
import com.google.common.collect.ImmutableList;
import java.util.Arrays;
import java.util.List;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import org.apache.commons.lang3.StringUtils;

public class HiveSchemaParser {

  // Regex Explain:
  //     ",         # Match a comma\n" +
  //     "(?!       # only if it's not followed by..." +
  //     " [^\s\\(]*   #   any number of characters except space and ( " +
  //     " \\)      #   followed by a closing parens" +
  //     ")         # End of lookahead",
  // Given input "a decimal(10,2),b int" --> this regex gets second comma instead of first
  private static final String HIVE_SCHEMA_DATATYPE_COMMA_SEPERATOR_REGEX = ",(?![^\\s\\(]*\\))";

  private static final Pattern HIVE_SCHEMA_DATATYPE_COMMA_SEPERATOR =
      Pattern.compile(HIVE_SCHEMA_DATATYPE_COMMA_SEPERATOR_REGEX);

  // Eg: SchemaString: a:int,\n b:boolean,\nc:struct<col1:timestamp,col2:int>,\nd:array<int>
  public static List<FieldInfo> parseSchema(String schemaString) {

    String completeSchema =
        "STRUCT<"
            + schemaString
                .trim()
                .replaceAll("`", "")
                .replaceAll("\\n", " ")
                .replaceAll(",[\\s]+", ", ")
                .replaceAll(":", " ")
            + ">";

    return extractStructSchema(completeSchema, "");
  }

  private static int findClosingAngle(String schemaString, int start) {

    int checkStart = schemaString.indexOf('<', start);
    if (checkStart == -1) {
      throw new RuntimeException("no Valid Start");
    }

    int counter = 0;
    int checkIndex = checkStart;
    for (Character ch : schemaString.substring(checkStart).toCharArray()) {

      switch (ch) {
        case '<':
          counter++;
          break;
        case '>':
          counter--;
          break;
      }

      if (counter == 0) {
        return checkIndex;
      }

      checkIndex++;
    }

    throw new RuntimeException("Illegal closing");
  }

  private static List<FieldInfo> extractStructSchema(
      String structDefinition, String parentFullName) {
    ImmutableList.Builder<FieldInfo> fieldsBuilder = ImmutableList.<FieldInfo>builder();

    String structCols =
        structDefinition
            .replaceFirst("^(?i)STRUCT<", "")
            .replaceAll(">$", "")
            .replaceAll("\\s*,\\s*", ",")
            .replaceAll("\\s+", " ");

    for (int index = 0; index < structCols.length(); ) {

      int spacePoint = structCols.indexOf(' ', index);
      String colName = structCols.substring(index, spacePoint);

      int dataTypeStart = spacePoint + 1;
      String remainingString = structCols.substring(dataTypeStart);

      // 1st Case: Struct as toplevel column in current schemaString
      if (StringUtils.startsWithIgnoreCase(remainingString, "STRUCT<")) {
        int innerStructClosing = findClosingAngle(structCols, dataTypeStart);

        List<FieldInfo> innerStructSchema =
            extractStructSchema(structCols.substring(dataTypeStart, innerStructClosing + 1), "");

        fieldsBuilder.add(
            FieldInfo.simple(colName, StandardSQLTypeName.STRUCT.name())
                .withFields(innerStructSchema)
                .withNewParent(parentFullName));
        index = innerStructClosing + 2;
        continue;
      }

      // 2nd Case: Array as toplevel column in current schemaString
      if (StringUtils.startsWithIgnoreCase(remainingString, "ARRAY<")) {
        int arrayClosing = findClosingAngle(structCols, dataTypeStart);
        String arrayType = structCols.substring(dataTypeStart + 6, arrayClosing);

        // 2.1 Array<struct>
        if (StringUtils.startsWithIgnoreCase(arrayType, "STRUCT<")) {
          List<FieldInfo> arrayStructFields = extractStructSchema(arrayType, "");

          fieldsBuilder.add(
              FieldInfo.simple(colName, StandardSQLTypeName.STRUCT.name())
                  .withFields(arrayStructFields)
                  .withNewParent(parentFullName)
                  .asRepeated());
        }
        // Skipping Array<Map> handling
        // Hive Array<Map> = BQ Array<STRUCT<Array<Struct<key: dt1, value: dt2>>>
        // This type is not supported implcitly on BQ external Table
        else {
          // 2.2 Assuming this is primitive type
          fieldsBuilder.add(
              FieldInfo.simple(colName, arrayType.toUpperCase())
                  .withNewParent(parentFullName)
                  .asRepeated());
        }

        index = arrayClosing + 2;
        continue;
      }

      // 3rd Case: Map as toplevel column in current schemaString
      if (StringUtils.startsWithIgnoreCase(remainingString, "MAP<")) {
        int mapClosing = findClosingAngle(structCols, dataTypeStart);
        String mapKeyVal = structCols.substring(dataTypeStart + 4, mapClosing);

        String[] mapKeyValTypes = mapKeyVal.split(HIVE_SCHEMA_DATATYPE_COMMA_SEPERATOR_REGEX);

        ImmutableList.Builder<FieldInfo> mapFieldsBuilder = ImmutableList.<FieldInfo>builder();
        // Map is always of type: Map<Primitive,AnyDataType>
        // So, Hive map = BQ Array<Struct<key keyDataType, value valueDataType>
        String mapKeyType = mapKeyValTypes[0];
        mapFieldsBuilder.add(FieldInfo.simple("key", mapKeyType).withNewParent(parentFullName));
        String mapValType;

        // This can be as complex as map<decimal(21,2),map<int,decimal(32,2)>>
        // So, both commas will get mapped, we need firs comma and rest of content
        mapValType =
            (mapKeyValTypes.length == 2)
                ? mapKeyValTypes[1]
                : String.join(
                    ",",
                    Arrays.asList(mapKeyValTypes)
                        .subList(1, mapKeyValTypes.length)
                        .toArray(new String[0]));

        List<FieldInfo> mapValSchemaFields =
            parseSchema(String.format("value %s", mapValType.toUpperCase()));
        // As the schema passed to above parse schema is only one column, so, the resultant
        //     list should be an array of size 1
        if (mapValSchemaFields.size() != 1)
          throw new RuntimeException("Illegal Map Schema Processing. Map Val Type = " + mapKeyType);

        mapFieldsBuilder.add(mapValSchemaFields.get(0));

        fieldsBuilder.add(
            FieldInfo.simple(colName, StandardSQLTypeName.STRUCT.name())
                .withFields(mapFieldsBuilder.build())
                .withNewParent(parentFullName)
                .asRepeated());

        index = mapClosing + 2;
        continue;
      }

      // Note: datatype can be a decimal(10,2), so, finding for comma for complete datatype might be
      // wrong
      // int end = remainingString.indexOf(',');

      int end = -1;
      Matcher matcher = HIVE_SCHEMA_DATATYPE_COMMA_SEPERATOR.matcher(remainingString);
      if (matcher.find()) end = matcher.start();

      int dataTypeEnd = (end != -1) ? end : remainingString.length();

      fieldsBuilder.add(
          FieldInfo.simple(colName, remainingString.substring(0, dataTypeEnd).toUpperCase())
              .withNewParent(parentFullName));

      index = spacePoint + dataTypeEnd + 2;
    }

    return fieldsBuilder.build();
  }
}
