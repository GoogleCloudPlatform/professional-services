/*
 * Copyright (C) 2018 Google Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not
 * use this file except in compliance with the License. You may obtain a copy of
 * the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS, WITHOUT
 * WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the
 * License for the specific language governing permissions and limitations under
 * the License.
 */

package com.google.cloud.pso.common;

import static com.google.common.truth.Truth.assertThat;
import static org.junit.jupiter.api.Assertions.assertThrows;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.io.IOException;
import org.junit.Before;
import org.junit.Test;
import org.junit.runner.RunWith;
import org.junit.runners.JUnit4;

/** Test class for {@link com.google.cloud.pso.common.ExtractKeyFn} */
@RunWith(JUnit4.class)
public class ExtractKeyFnTest {

  private static final String ID_KEY = "/sku";
  private static final String ID_VALUE = "123";
  private static final String TEST_JSON = "{ \"sku\": 123}";
  private ObjectMapper mapper;

  @Before
  public void setup() {
    mapper = new ObjectMapper();
  }

  @Test
  public void testJsonWithValidId() throws IOException {
    ExtractKeyFn extractKeyFn = new ExtractKeyFn(ID_KEY);
    JsonNode input = mapper.readTree(TEST_JSON);
    String actual = extractKeyFn.apply(input);
    assertThat(actual).isEqualTo(ID_VALUE);
  }

  @Test
  public void testJsonWithInvalidId() throws IOException {
    ExtractKeyFn extractKeyFn = new ExtractKeyFn("/invalid");
    JsonNode input = mapper.readTree(TEST_JSON);

    RuntimeException thrown =
        assertThrows(
            RuntimeException.class,
            () -> {
              String actual = extractKeyFn.apply(input);
            });

    assertThat(thrown).hasMessageThat().contains("Unable to extract id field: /invalid");
  }
}
