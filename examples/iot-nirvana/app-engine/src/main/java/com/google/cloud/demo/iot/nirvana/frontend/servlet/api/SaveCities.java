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

package com.google.cloud.demo.iot.nirvana.frontend.servlet.api;

import com.google.cloud.demo.iot.nirvana.common.City;
import com.google.cloud.demo.iot.nirvana.common.FormatException;
import com.google.cloud.demo.iot.nirvana.common.TemperatureUtils;
import com.google.cloud.demo.iot.nirvana.frontend.datastore.DatastoreService;
import com.google.cloud.demo.iot.nirvana.frontend.datastore.CityEntity;
import com.google.gson.Gson;
import java.io.IOException;
import java.util.Map;
import java.util.logging.Logger;
import javax.servlet.http.HttpServlet;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

/** Class that represents a servlet used to get application configuration */
public class SaveCities extends HttpServlet implements ApiInterface {

  private static final long serialVersionUID = 6919710226120460383L;
  private static final Logger LOG = Logger.getLogger(SaveCities.class.getName());
  private static final Gson GSON = new Gson();

  public void doGet(HttpServletRequest req, HttpServletResponse resp) throws IOException {

    // Return data
    RestResponse restResponse = new RestResponse();
    resp.setContentType(com.google.common.net.MediaType.JSON_UTF_8.toString());

    // Load cities test dataset and save it to Datastore only if no City entities are in Datastore
    try {
      DatastoreService<CityEntity> dsCity = new DatastoreService<CityEntity>(CityEntity.class);
      Map<String, City> mockCities = TemperatureUtils.loadCities();
      for (Map.Entry<String, City> entry : mockCities.entrySet()) {
        String id = entry.getKey();
        City mockCity = entry.getValue();
        CityEntity cityEntity = new CityEntity(id, mockCity);
        dsCity.save(cityEntity);
      }
      restResponse.setCode(javax.servlet.http.HttpServletResponse.SC_OK);
      restResponse.setMessage(HTML_CODE_200_OK_MESSAGE);
      resp.setStatus(javax.servlet.http.HttpServletResponse.SC_OK);
    } catch (FormatException e) {
      LOG.severe(String.format("Failed to save cities to Datastore. Cause %s", e.getMessage()));
      restResponse.setCode(HttpServletResponse.SC_INTERNAL_SERVER_ERROR);
      restResponse.setMessage(HTML_CODE_500_INTERNAL_SERVER_ERROR);
      resp.setStatus(HttpServletResponse.SC_INTERNAL_SERVER_ERROR);
    }

    // Return the HTTP response
    resp.getWriter().println(GSON.toJson(restResponse));
    return;
  }
}
