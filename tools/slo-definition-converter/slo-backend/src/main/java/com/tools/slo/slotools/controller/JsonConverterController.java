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

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.tools.slo.slotools.model.SloJsonConverterRequest;
import com.tools.slo.slotools.model.SloTFResponse;
import com.tools.slo.slotools.service.JsonConverterService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * REST controller for JSON conversion operations.
 *
 * <p>Provides an endpoint to convert raw JSON input into a specific target format (TF).
 */
@RestController
@RequestMapping("/slo/json-converter")
public class JsonConverterController {

  private final ObjectMapper objectMapper;
  private final JsonConverterService jcService;

  @Autowired
  public JsonConverterController(ObjectMapper objectMapper, JsonConverterService jcService) {
    this.objectMapper = objectMapper;
    this.jcService = jcService;
  }

  /**
   * Converts raw JSON input into the target format (TF).
   *
   * @param request The request containing the raw JSON input.
   * @return A ResponseEntity with the conversion result or an error message.
   */
  @PostMapping("/convert")
  public ResponseEntity<SloTFResponse> convertToObject(
      @RequestBody SloJsonConverterRequest request) {
    // Read JSON string and convert to JsonNode
    JsonNode jsonNode;
    try {
      jsonNode = objectMapper.readTree(request.getJsonRaw());
      String tfResult = jcService.convertToTF(jsonNode);
      new SloTFResponse();
      return new ResponseEntity<>(
          SloTFResponse.builder().tfResult(tfResult).build(), HttpStatus.OK);
    } catch (JsonProcessingException e) {
      return new ResponseEntity<>(
          new SloTFResponse().builder().error(e.getMessage()).build(),
          HttpStatus.INTERNAL_SERVER_ERROR);
    } catch (Exception e) {
      return new ResponseEntity<>(
          new SloTFResponse().builder().error(e.getMessage()).build(),
          HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }
}
