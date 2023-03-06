/*
 * Copyright 2023 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
package com.google.cloud.pso.bqremotefunc;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.google.cloud.functions.HttpFunction;
import com.google.cloud.functions.HttpRequest;
import com.google.cloud.functions.HttpResponse;
import com.google.cloud.pso.bqremotefunc.util.FunctionResponseObj;
import com.google.cloud.pso.bqremotefunc.util.remoteFunctionObject;
import com.google.gson.*;
import java.io.BufferedWriter;
import java.util.logging.Logger;

public class StringFormat implements HttpFunction {
  // Use GSON (https://github.com/google/gson) to parse JSON content.
  private static final Gson gson = new Gson();
  private static final Logger logger = Logger.getLogger(StringFormat.class.getName());
  // Responds to an HTTP request using data from the request body parsed according to the
  // "content-type" header.
  @Override
  public void service(HttpRequest request, HttpResponse response) throws Exception {

    JsonElement requestParsed = gson.fromJson(request.getReader(), JsonElement.class);
    JsonObject requestJson = requestParsed.getAsJsonObject();
    ObjectMapper objectMapper = new ObjectMapper();
    FunctionResponseObj functionResponseObj = new FunctionResponseObj();
    String[][] calls = null;

    if (requestJson != null) {
      logger.info(">> Request Json: " + requestJson);
      JsonNode jsonNode = objectMapper.readTree(String.valueOf(requestJson));
      remoteFunctionObject remotefnObject =
          objectMapper.treeToValue(jsonNode, remoteFunctionObject.class);

      calls = remotefnObject.getCalls();

      logger.info(">> printing calls: " + calls);
      String[] responseArr = new String[calls.length];
      for (int index = 0; index < calls.length; index++) {

        for (String str : calls[index]) {
          logger.info(">> " + index + ": " + str);
          responseArr[index] = str.toString() + "_test";
        }
      }
      logger.info(">> response: " + responseArr);
      functionResponseObj.setReplies(responseArr);
      // Respond with a formatted string
      BufferedWriter writer = response.getWriter();
      Gson gson = new GsonBuilder().disableHtmlEscaping().create();
      writer.write(gson.toJson(functionResponseObj));
    }
  }
}
