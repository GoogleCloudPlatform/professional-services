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

/** {@link org.apache.beam.sdk.coders.Coder} for {@link com.fasterxml.jackson.databind.JsonNode} */
package com.google.cloud.pso.coders;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.apache.beam.sdk.coders.CoderException;
import org.apache.beam.sdk.coders.CustomCoder;
import org.apache.beam.sdk.coders.StringUtf8Coder;
import java.io.IOException;
import java.io.InputStream;
import java.io.OutputStream;

public class JsonNodeCoder extends CustomCoder<JsonNode> {

  private static final StringUtf8Coder STRING_UTF_8_CODER = StringUtf8Coder.of();
  private static final ObjectMapper MAPPER = new ObjectMapper();
  private static final JsonNodeCoder JSON_NODE_CODER = new JsonNodeCoder();

  private JsonNodeCoder() {}

  public static JsonNodeCoder of() {
    return JSON_NODE_CODER;
  }

  @Override
  public void encode(JsonNode value, OutputStream outStream) throws IOException {
    if (value == null) {
      throw new CoderException("The JsonNodeCoder cannot encode a null object!");
    }
    STRING_UTF_8_CODER.encode(MAPPER.writer().writeValueAsString(value), outStream);
  }

  @Override
  public JsonNode decode(InputStream inStream) throws IOException {
    String jsonString = STRING_UTF_8_CODER.decode(inStream);
    return MAPPER.reader().readTree(jsonString);
  }
}
