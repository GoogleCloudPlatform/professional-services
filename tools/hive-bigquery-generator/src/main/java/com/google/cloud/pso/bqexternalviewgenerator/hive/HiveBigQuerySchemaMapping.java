/*
 * Copyright 2022 Google
 * This software is provided as-is, without warranty or representation for any use or purpose. 
 * Your use of it is subject to your agreement with Google.
 */

package com.google.cloud.pso.bqexternalviewgenerator.hive;


import java.util.ArrayList;
import java.util.Arrays;
import org.apache.commons.lang3.StringUtils;

// TODO: Remove deprecated methods
public class HiveBigQuerySchemaMapping {
  private static final ArrayList<String> HIVE_NUMERIC_TYPES =
      new ArrayList<String>(Arrays.asList("bigint", "int", "tinyint", "smallint", "integer"));
  private static final ArrayList<String> HIVE_FLOATING_POINT_TYPES =
      new ArrayList<String>(Arrays.asList("double", "float"));

  public static String getExtPartitionBQType(String hiveType, BigQueryTableType bigQueryTableType) {
    if (isTimeStampType(hiveType)) return "STRING";

    return getBQType(hiveType, bigQueryTableType);
  }

  public enum BigQueryTableType {
    EXTERNAL_TABLE,
    VIEW
  }

  public static String getBQType(String hiveType, BigQueryTableType bigQueryTableType) {

    if (isIntegerType(hiveType)) return "INT64";

    if (isFloatingPointType(hiveType)) return "FLOAT64";

    if (isStringType(hiveType)) return "STRING";

    if (isTimeStampType(hiveType)) return getBQTimestampType(bigQueryTableType);

    // if (isStructType(hiveType)) return getBQStructType(hiveType, bigQueryTableType);
    //
    // if (isMapType(hiveType)) return getBQMapType(hiveType, bigQueryTableType);
    //
    // if (isArrayType(hiveType)) return getBQArrayType(hiveType, bigQueryTableType);

    if (isDateType(hiveType)) return "DATE";

    if (isBooleanType(hiveType)) return "BOOL";

    if (isBinaryType(hiveType)) return "BYTES";

    if (isDecimalType(hiveType)) return "NUMERIC";

    return "UNKNOWN";
  }

  private static boolean isIntegerType(String hiveType) {
    return HIVE_NUMERIC_TYPES.contains(hiveType.toLowerCase());
  }

  private static boolean isFloatingPointType(String hiveType) {
    return HIVE_FLOATING_POINT_TYPES.contains(hiveType.toLowerCase());
  }

  private static boolean isStringType(String hiveType) {
    return (hiveType.equalsIgnoreCase("string")
        || hiveType.toLowerCase().startsWith("varchar")
        || hiveType.toLowerCase().startsWith("char"));
  }

  @Deprecated
  private static boolean isStructType(String hiveType) {
    return hiveType.toLowerCase().startsWith("struct<");
  }

  @Deprecated
  private static boolean isArrayType(String hiveType) {
    return hiveType.toLowerCase().startsWith("array<");
  }

  private static boolean isDateType(String hiveType) {
    return hiveType.equalsIgnoreCase("date");
  }

  private static boolean isTimeStampType(String hiveType) {
    return hiveType.equalsIgnoreCase("timestamp");
  }

  private static boolean isBooleanType(String hiveType) {
    return hiveType.equalsIgnoreCase("boolean");
  }

  private static boolean isBinaryType(String hiveType) {
    return hiveType.equalsIgnoreCase("binary");
  }

  private static boolean isDecimalType(String hiveType) {
    return hiveType.toLowerCase().startsWith("decimal");
  }

  @Deprecated
  private static boolean isMapType(String hiveType) {
    return hiveType.toLowerCase().startsWith("map<");
  }

  private static String getBQTimestampType(BigQueryTableType bigQueryTableType) {
    return (bigQueryTableType == BigQueryTableType.EXTERNAL_TABLE) ? "TIMESTAMP" : "DATETIME";
  }

  @Deprecated
  private static String getBQStructType(String hiveType, BigQueryTableType bigQueryTableType) {
    StringBuilder bqStructType = new StringBuilder();

    bqStructType.append("STRUCT<"); // Struct Start

    String structCols =
        hiveType
            .trim()
            .replaceFirst("^(?i)STRUCT<", "")
            .replaceAll(">$", "")
            .replaceAll("`", "") // To remove quotes from columns names (will explicitly add later)
            .replaceAll("\\s*,\\s*", ",")
            .replaceAll("\\s+", " ")
            .replaceAll(":", " "); // Removing colon to make the struct BQ compatible

    for (int index = 0; index < structCols.length(); ) {
      int spacePoint = structCols.indexOf(' ', index);
      if (spacePoint == -1) return null;

      // This handles more than 1 cols
      if (structCols.charAt(index) == ',') {
        bqStructType.append(",");
        index++;
        continue;
      }

      String colName = structCols.substring(index, spacePoint);

      int dataTypeStart = spacePoint + 1;
      String remainingString = structCols.substring(dataTypeStart);

      if (StringUtils.startsWithIgnoreCase(remainingString, "STRUCT<")) {
        int innerStructClosing = findClosingAngle(structCols, dataTypeStart);

        String innerStructSchema =
            getBQStructType(
                structCols.substring(dataTypeStart, innerStructClosing + 1), bigQueryTableType);

        bqStructType.append(String.format("`%s` %s", colName, innerStructSchema));
        index = innerStructClosing + 1;
        continue;
      }

      // Assuming two cases: Array_Struct / Array_primitive
      // Todo: Array of Map
      if (StringUtils.startsWithIgnoreCase(remainingString, "ARRAY<")) {
        int arrayClosing = findClosingAngle(structCols, dataTypeStart);
        String arrayType = structCols.substring(dataTypeStart + 6, arrayClosing);

        if (StringUtils.startsWithIgnoreCase(arrayType, "STRUCT<")) {
          String arrayStructFields = getBQStructType(arrayType, bigQueryTableType);

          bqStructType.append(String.format("`%s` ARRAY<%s>", colName, arrayStructFields));

        } else {
          // If not Struct, then:  primitive datatype
          // todo: Add support for Array of map
          bqStructType.append(
              String.format("`%s` ARRAY<%s>", colName, getBQType(arrayType, bigQueryTableType)));
        }

        index = arrayClosing + 1;
        continue;
      }

      // Handling primitive datatype
      // Todo: map as 3rd case
      int end = remainingString.indexOf(',');
      int dataTypeEnd = (end != -1) ? end : remainingString.length();

      bqStructType.append(
          String.format(
              "`%s` %s",
              colName, getBQType(remainingString.substring(0, dataTypeEnd), bigQueryTableType)));

      if (end != -1) bqStructType.append(",");

      index = spacePoint + dataTypeEnd + 2;
    }

    bqStructType.append(">"); // Struct Closing
    return bqStructType.toString();
  }

  @Deprecated
  private static String getBQArrayType(String hiveType, BigQueryTableType bigQueryTableType) {
    // since Struct is already solved, so, reusing the struct function to derive array type
    String aliasHiveType = "STRUCT<ALIAS_COL:" + hiveType + ">";
    String aliasBqStructType = getBQStructType(aliasHiveType, bigQueryTableType);

    // removing the aliased fields to get original BQ array datatype
    return (aliasBqStructType != null)
        ? aliasBqStructType.replaceAll("STRUCT<`ALIAS_COL` ", "").replaceAll(">$", "")
        : null;
  }

  @Deprecated
  private static String getBQMapType(String hiveType, BigQueryTableType bigQueryTableType) {
    // Map<string,string>
    String mapCols =
        hiveType
            .trim()
            .replaceFirst("^(?i)MAP<", "")
            .replaceAll(">$", "")
            .replaceAll("`", "") // To remove quotes from columns names (will explicitly add later)
            .replaceAll("\\s*,\\s*", ",")
            .replaceAll("\\s+", " ")
            .replaceAll(":", " "); // Removing colon to make the struct BQ compatible

    int commaIndex = mapCols.indexOf(","); // First Occurance

    return (commaIndex != -1)
        ? String.format(
            "ARRAY<STRUCT<`key` %s,`value` %s>>",
            getBQType(
                mapCols.substring(0, commaIndex), bigQueryTableType), // Data type of Key column
            getBQType(
                mapCols.substring(commaIndex + 1), bigQueryTableType)) // Data type of value column
        : null;
  }

  @Deprecated
  private static int findClosingAngle(String schemaString, int start) {

    int checkStart = schemaString.indexOf('<', start);
    if (checkStart == -1) {
      throw new RuntimeException("no Valid Start");
    }

    int counter = 0;
    int checkIndex = checkStart;
    for (char ch : schemaString.substring(checkStart).toCharArray()) {

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
}
