/**
 * Copyright 2024 Google LLC
 *
 * <p>Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file
 * except in compliance with the License. You may obtain a copy of the License at
 *
 * <p>https://www.apache.org/licenses/LICENSE-2.0
 *
 * <p>Unless required by applicable law or agreed to in writing, software distributed under the
 * License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either
 * express or implied. See the License for the specific language governing permissions and
 * limitations under the License.
 */
package com.tools.slo.slotools.controller;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.tools.slo.slotools.model.SloJsonConverterRequest;
import com.tools.slo.slotools.model.SloTFResponse;
import com.tools.slo.slotools.service.JsonConverterService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.MockitoAnnotations;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;

public class JsonConverterControllerTest {

  @InjectMocks private JsonConverterController jsonConverterController;

  @Mock private ObjectMapper objectMapper;

  @Mock private JsonConverterService jsonConverterService;

  @BeforeEach
  public void setup() {
    MockitoAnnotations.openMocks(this);
  }

  @Test
  public void testConvertToObject_Success() throws Exception {
    SloJsonConverterRequest request = new SloJsonConverterRequest();
    request.setJsonRaw("{\"key\": \"value\"}");
    JsonNode jsonNode = objectMapper.readTree(request.getJsonRaw());
    String tfResult = "Converted Terraform Result";

    when(objectMapper.readTree(any(String.class))).thenReturn(jsonNode);
    when(jsonConverterService.convertToTF(any(JsonNode.class))).thenReturn(tfResult);

    ResponseEntity<SloTFResponse> response = jsonConverterController.convertToObject(request);

    assertEquals(HttpStatus.OK, response.getStatusCode());
  }

  @Test
  public void testConvertToObject_JsonProcessingException() throws Exception {
    SloJsonConverterRequest request = new SloJsonConverterRequest();
    request.setJsonRaw("{\"key\": \"value\"}");

    when(objectMapper.readTree(any(String.class)))
        .thenThrow(new com.fasterxml.jackson.core.JsonProcessingException("Invalid JSON") {});

    ResponseEntity<SloTFResponse> response = jsonConverterController.convertToObject(request);

    assertEquals(HttpStatus.INTERNAL_SERVER_ERROR, response.getStatusCode());
    assertNull(response.getBody().getTfResult());
    assertEquals("Invalid JSON", response.getBody().getError());
  }

  @Test
  public void testConvertToObject_Exception() throws Exception {
    SloJsonConverterRequest request = new SloJsonConverterRequest();
    request.setJsonRaw("{\"key\": \"value\"}");

    when(objectMapper.readTree(any(String.class)))
        .thenThrow(new RuntimeException("Unexpected error"));

    ResponseEntity<SloTFResponse> response = jsonConverterController.convertToObject(request);

    assertEquals(HttpStatus.INTERNAL_SERVER_ERROR, response.getStatusCode());
    assertNull(response.getBody().getTfResult());
    assertEquals("Unexpected error", response.getBody().getError());
  }
}
