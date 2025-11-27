/*
 *  Copyright 2024 Google LLC
 *
 *  Licensed under the Apache License, Version 2.0 (the "License");
 *  you may not use this file except in compliance with the License.
 *  You may obtain a copy of the License at
 *
 *      https://www.apache.org/licenses/LICENSE-2.0
 *
 *  Unless required by applicable law or agreed to in writing, software
 *  distributed under the License is distributed on an "AS IS" BASIS,
 *  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 *  See the License for the specific language governing permissions and
 *  limitations under the License.
 */
package com.google.cloud.pso.migration.utils;

import com.google.gson.*;
import java.math.BigDecimal;
import java.util.*;
import java.util.Base64;
import java.util.logging.Logger;

public class DynamoRowUtils {
  private static final Gson gson = new GsonBuilder().serializeNulls().create();
  private static final Logger LOGGER = Logger.getLogger(DynamoRowUtils.class.getName());

  public String convertDynamoDBJson(String input, String bigtableRowKey, String columnFamily) {
    try {

      JsonObject dynamoDBItem = JsonParser.parseString(input).getAsJsonObject();
      return convertItemToCells(dynamoDBItem, bigtableRowKey, columnFamily);
    } catch (Exception e) {
      LOGGER.severe("Failed to convert DynamoDB JSON: " + e.getMessage());
      throw new RuntimeException("Unable to convert the data: " + e.getMessage(), e);
    }
  }

  private String convertItemToCells(
      JsonObject dynamoDBItem, String bigtableRowKey, String columnFamily) {
    try {
      JsonObject item = dynamoDBItem.getAsJsonObject(DataLoadConstants.DynamoDBFields.ITEMS);
      Map<String, Object> convertedData = new HashMap<>();

      // Convert all DynamoDB types to standard format
      for (Map.Entry<String, JsonElement> entry : item.entrySet()) {
        convertedData.put(entry.getKey(), parseDynamoDBValue(entry.getValue().getAsJsonObject()));
      }

      // Extract row_key
      Object rowKeyObj = convertedData.remove(bigtableRowKey);
      if (rowKeyObj == null) {
        throw new IllegalArgumentException("Missing required row key field: " + bigtableRowKey);
      }
      String rowKey = rowKeyObj.toString();

      // Create result structure
      JsonObject result = new JsonObject();
      result.addProperty(DataLoadConstants.SchemaFields.ROW_KEY, rowKey);

      JsonArray cells = new JsonArray();

      // Process each field
      for (Map.Entry<String, Object> entry : convertedData.entrySet()) {
        String key = entry.getKey();
        Object value = entry.getValue();

        if (value instanceof Map) {
          // Handle map type - flatten with dot notation
          cells.addAll(flattenMap(key, (Map<String, Object>) value, columnFamily));
        } else if (value instanceof List || value instanceof Set) {
          // Handle list and set types
          JsonObject cell = createCell(columnFamily, key, value);
          cells.add(cell);
        } else {
          // Handle primitive types
          JsonObject cell = createCell(columnFamily, key, value);
          cells.add(cell);
        }
      }

      result.add(DataLoadConstants.SchemaFields.CELLS, cells);
      return gson.toJson(result);
    } catch (Exception e) {
      LOGGER.severe("Failed to convert DynamoDB item to cells: " + e.getMessage());
      throw new RuntimeException("Unable to convert the data: " + e.getMessage(), e);
    }
  }

  private JsonObject createCell(String columnFamily, String key, Object value) {
    try {
      JsonObject cell = new JsonObject();
      cell.addProperty(DataLoadConstants.SchemaFields.COLUMN_FAMILY, columnFamily);
      cell.addProperty(DataLoadConstants.SchemaFields.COLUMN, key);
      cell.add(DataLoadConstants.SchemaFields.PAYLOAD, gson.toJsonTree(value));
      return cell;
    } catch (Exception e) {
      throw new RuntimeException("Unable to create cell for key " + key + ": " + e.getMessage(), e);
    }
  }

  Object parseDynamoDBValue(JsonObject value) {
    try {
      String typeKey = value.keySet().iterator().next();
      JsonElement actualValue = value.get(typeKey);

      switch (typeKey) {
        case "S": // String
          return actualValue.getAsString();

        case "N": // Number
          String numStr = actualValue.getAsString();
          try {
            if (numStr.contains(".")) {
              return new BigDecimal(numStr);
            }
            return Long.parseLong(numStr);
          } catch (NumberFormatException e) {
            throw new RuntimeException("Invalid number format: " + numStr, e);
          }

        case "B": // Binary
          String binStr = actualValue.getAsString();
          return Base64.getEncoder().encodeToString(binStr.getBytes());

        case "BOOL": // Boolean
          return actualValue.getAsBoolean();

        case "NULL": // Null
          return null;

        case "M": // Map
          Map<String, Object> map = new HashMap<>();
          JsonObject mapObj = actualValue.getAsJsonObject();
          for (Map.Entry<String, JsonElement> entry : mapObj.entrySet()) {
            map.put(entry.getKey(), parseDynamoDBValue(entry.getValue().getAsJsonObject()));
          }
          return map;

        case "L": // List
          List<Object> list = new ArrayList<>();
          JsonArray array = actualValue.getAsJsonArray();
          for (JsonElement element : array) {
            list.add(parseDynamoDBValue(element.getAsJsonObject()));
          }
          return list;

        case "SS": // String Set
          Set<String> stringSet = new HashSet<>();
          JsonArray ssArray = actualValue.getAsJsonArray();
          for (JsonElement element : ssArray) {
            stringSet.add(element.getAsString());
          }
          return new ArrayList<>(stringSet);

        case "NS": // Number Set
          Set<Number> numberSet = new HashSet<>();
          JsonArray nsArray = actualValue.getAsJsonArray();
          for (JsonElement element : nsArray) {
            String num = element.getAsString();
            try {
              if (num.contains(".")) {
                numberSet.add(new BigDecimal(num));
              } else {
                numberSet.add(Long.parseLong(num));
              }
            } catch (NumberFormatException e) {
              throw new RuntimeException("Invalid number in number set: " + num, e);
            }
          }
          return new ArrayList<>(numberSet);

        case "BS": // Binary Set
          Set<String> binarySet = new HashSet<>();
          JsonArray bsArray = actualValue.getAsJsonArray();
          for (JsonElement element : bsArray) {
            String binData = element.getAsString();
            binarySet.add(Base64.getEncoder().encodeToString(binData.getBytes()));
          }
          return new ArrayList<>(binarySet);

        default:
          throw new IllegalArgumentException("Unknown DynamoDB type: " + typeKey);
      }
    } catch (Exception e) {
      throw new RuntimeException("Unable to parse DynamoDB value: " + e.getMessage(), e);
    }
  }

  private JsonArray flattenMap(String prefix, Map<String, Object> mapData, String columnFamily) {
    try {
      JsonArray cells = new JsonArray();

      for (Map.Entry<String, Object> entry : mapData.entrySet()) {
        String column = prefix.isEmpty() ? entry.getKey() : prefix + "." + entry.getKey();
        Object value = entry.getValue();

        if (value instanceof Map
            && !(value instanceof String)
            && !(value instanceof Number)
            && !(value instanceof Boolean)) {
          // Recursively flatten nested maps
          cells.addAll(flattenMap(column, (Map<String, Object>) value, columnFamily));
        } else {
          JsonObject cell = createCell(columnFamily, column, value);
          cells.add(cell);
        }
      }

      return cells;
    } catch (Exception e) {
      throw new RuntimeException(
          "Unable to flatten map for prefix " + prefix + ": " + e.getMessage(), e);
    }
  }
}
