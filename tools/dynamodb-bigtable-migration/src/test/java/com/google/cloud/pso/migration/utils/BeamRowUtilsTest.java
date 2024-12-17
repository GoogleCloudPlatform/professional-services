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

import static org.junit.Assert.*;

import com.google.gson.Gson;
import com.google.gson.JsonObject;
import java.math.BigDecimal;
import org.junit.Before;
import org.junit.Test;

/** Unit tests for BeamRowUtils. */
public class BeamRowUtilsTest {

  private DynamoRowUtils dynamoRowUtils;
  private Gson gson;

  @Before
  public void setUp() {
    dynamoRowUtils = new DynamoRowUtils();
    gson = new Gson();
  }

  @Test
  public void testConvertSimpleDynamoDBItem() {
    // Prepare a simple DynamoDB JSON input
    String input =
        "{\"Item\": {\"id\": {\"S\": \"123\"}, \"name\": {\"S\": \"John Doe\"}, \"age\": {\"N\":"
            + " \"30\"}}}";
    String bigtableRowKey = "id";
    String columnFamily = "cf";

    // Convert DynamoDB JSON to Bigtable JSON
    String bigtableJson = dynamoRowUtils.convertDynamoDBJson(input, bigtableRowKey, columnFamily);

    // Verify the conversion
    JsonObject jsonObject = gson.fromJson(bigtableJson, JsonObject.class);
    assertEquals("123", jsonObject.get("row_key").getAsString());

    // Verify cells
    assertTrue(jsonObject.has("cells"));
    assertEquals(2, jsonObject.getAsJsonArray("cells").size());
  }

  @Test
  public void testConvertComplexDynamoDBItem() {
    // Prepare a complex DynamoDB JSON input with various types
    String input =
        "{\"Item\": {\"id\": {\"S\": \"user123\"},\"name\": {\"S\": \"Jane Smith\"},\"age\":"
            + " {\"N\": \"35\"},\"active\": {\"BOOL\": true},\"tags\": {\"L\": [{\"S\": \"admin\"},"
            + " {\"S\": \"user\"}]},\"metadata\": {\"M\": {\"role\": {\"S\": \"manager\"},"
            + " \"department\": {\"S\": \"IT\"}}},\"scores\": {\"NS\": [\"10.5\", \"20\","
            + " \"30.75\"]},\"binary_data\": {\"B\": \"binary_content\"}}}";
    String bigtableRowKey = "id";
    String columnFamily = "cf";

    // Convert DynamoDB JSON to Bigtable JSON
    String bigtableJson = dynamoRowUtils.convertDynamoDBJson(input, bigtableRowKey, columnFamily);

    // Verify the conversion
    JsonObject jsonObject = gson.fromJson(bigtableJson, JsonObject.class);
    assertEquals("user123", jsonObject.get("row_key").getAsString());

    // Verify cells
    assertTrue(jsonObject.has("cells"));
    assertEquals(8, jsonObject.getAsJsonArray("cells").size());
  }

  @Test
  public void testMissingRowKeyThrowsException() {
    // Prepare a DynamoDB JSON input without the specified row key
    String input = "{\"Item\": {\"name\": {\"S\": \"Bob Brown\"}}}";
    String bigtableRowKey = "user_id";
    String columnFamily = "user_info";

    // This will explicitly check that the expected exception is thrown
    RuntimeException exception =
        assertThrows(
            RuntimeException.class,
            () -> {
              dynamoRowUtils.convertDynamoDBJson(input, bigtableRowKey, columnFamily);
            });

    assertTrue(exception.getMessage().contains("Missing required row key field: user_id"));
  }

  @Test
  public void testParseDynamoDBValueTypes() {
    // Test String
    JsonObject stringValue = new JsonObject();
    stringValue.addProperty("S", "test string");
    assertEquals("test string", dynamoRowUtils.parseDynamoDBValue(stringValue));

    // Test Number (Integer)
    JsonObject intValue = new JsonObject();
    intValue.addProperty("N", "42");
    assertEquals(42L, dynamoRowUtils.parseDynamoDBValue(intValue));

    // Test Number (Decimal)
    JsonObject decimalValue = new JsonObject();
    decimalValue.addProperty("N", "42.5");
    assertEquals(new BigDecimal("42.5"), dynamoRowUtils.parseDynamoDBValue(decimalValue));

    // Test Boolean
    JsonObject boolValue = new JsonObject();
    boolValue.addProperty("BOOL", true);
    assertEquals(true, dynamoRowUtils.parseDynamoDBValue(boolValue));

    // Test Null
    JsonObject nullValue = new JsonObject();
    nullValue.addProperty("NULL", true);
    assertNull(dynamoRowUtils.parseDynamoDBValue(nullValue));
  }
}
