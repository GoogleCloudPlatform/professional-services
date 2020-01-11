/*
 * Copyright 2019 Google LLC
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
package com.endpoint;

import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.util.Base64;
import java.util.HashMap;
import java.util.Map;
import com.google.gson.Gson;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestMethod;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class EndpointController {
  private final Logger LOG = LoggerFactory.getLogger(EndpointController.class);

  private static Gson gson = new Gson();
  @RequestMapping(value = "/", method = RequestMethod.POST)
  public ResponseEntity receiveMessage(@RequestBody Body body) throws Exception {

    Body.Message message = body.getMessage();
    if (message == null) {
      String msg = "Bad Request: invalid Pub/Sub message format";
      LOG.error(msg);
      return new ResponseEntity(msg, HttpStatus.BAD_REQUEST);
    }

    String data = message.getData();
    String jsonString = new String(Base64.getDecoder().decode(data));
    Gson gson = new Gson();
    Map<String, String> maps = new HashMap<String, String>();
    maps = (Map<String, String>) gson.fromJson(jsonString, maps.getClass());

    StringBuffer sb = new StringBuffer();
    for (Map.Entry entry : maps.entrySet()) {
      sb.append("--").append(entry.getKey()).append("=").append(entry.getValue()).append(" ");
    }
    String command = String.format("java -cp /dataflowApp.jar com.demo.dataflow.GoBikeToBigQuery %s", sb.toString());
    LOG.info(command);
    Process process = Runtime.getRuntime()
            .exec(String.format(command));

    BufferedReader processInputReader =
            new BufferedReader(new InputStreamReader(process.getInputStream()));
    BufferedReader processErrorReader =
            new BufferedReader(new InputStreamReader(process.getErrorStream()));
    process.waitFor();
    int status = process.exitValue();
    StringBuffer retVal = new StringBuffer("{");
    if (status ==0){
      retVal.append("\"status\": \"success\", \"result\": [" );
      retVal.append(getResult(processInputReader));
      return new ResponseEntity(retVal.toString()+ "]" + "}", HttpStatus.OK);
    }
    else {
      retVal.append("\"status\": \"error\", \"result\": [");
      retVal.append(getResult(processErrorReader));
      return new ResponseEntity(retVal.toString()+ "]" + "}", HttpStatus.BAD_REQUEST);
    }

  }

  public static String getResult(BufferedReader reader) throws Exception{
    StringBuffer retVal = new StringBuffer();
    String line = reader.readLine();
    int lineNumber=0;
    while (line != null) {
      retVal.append(String.format("{%s:%s},", gson.toJson("line" + lineNumber), gson.toJson(line)));
      line = reader.readLine();
      lineNumber++;
    }
    return retVal.substring(0, retVal.toString().length()-1);

  }
}
