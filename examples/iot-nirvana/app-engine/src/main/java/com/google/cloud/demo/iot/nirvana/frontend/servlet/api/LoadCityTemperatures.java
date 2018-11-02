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

import com.google.cloud.demo.iot.nirvana.frontend.datastore.DatastoreService;
import com.google.cloud.demo.iot.nirvana.frontend.datastore.CityEntity;
import com.google.cloud.demo.iot.nirvana.frontend.datastore.CityTemperature;
import com.google.cloud.demo.iot.nirvana.frontend.shared.Utils;
import com.google.gson.Gson;
import com.googlecode.objectify.Key;
import java.io.IOException;
import java.util.List;
import java.util.logging.Logger;
import javax.servlet.http.HttpServlet;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

/** Class that represents a servlet used to get data of a city (i.e. temperature) */
public class LoadCityTemperatures extends HttpServlet implements ApiInterface {

  private static final long serialVersionUID = 6919710226120460383L;
  private static final Logger LOG = Logger.getLogger(LoadCityTemperatures.class.getName());
  private static final Gson GSON = new Gson();
  private static final String API_PARAM_CITY_TEMPERATURE = "id";
  private static final String API_PARAM_CITY_TEMPERATURE_NUM_RECORD = "numRecord";

  public void doGet(HttpServletRequest req, HttpServletResponse resp) throws IOException {

    // return data
    RestResponse restResponse = new RestResponse();

    // check if parameters are present
    if (req.getParameter(API_PARAM_CITY_TEMPERATURE) == null) {
      // error
      LOG.warning(
          HTML_CODE_400_BAD_REQUEST
              + " - "
              + API_PARAM_CITY_TEMPERATURE
              + " parameter missing");
      restResponse.setCode(javax.servlet.http.HttpServletResponse.SC_BAD_REQUEST);
      restResponse.setMessage(HTML_CODE_400_BAD_REQUEST);
      resp.setStatus(javax.servlet.http.HttpServletResponse.SC_BAD_REQUEST);
      resp.getWriter().println(GSON.toJson(restResponse));
      return;
    }
    if (req.getParameter(API_PARAM_CITY_TEMPERATURE_NUM_RECORD) == null) {
      // error
      LOG.warning(
          HTML_CODE_400_BAD_REQUEST
              + " - "
              + API_PARAM_CITY_TEMPERATURE_NUM_RECORD
              + " parameter missing");
      restResponse.setCode(javax.servlet.http.HttpServletResponse.SC_BAD_REQUEST);
      restResponse.setMessage(HTML_CODE_400_BAD_REQUEST);
      resp.setStatus(javax.servlet.http.HttpServletResponse.SC_BAD_REQUEST);
      resp.getWriter().println(GSON.toJson(restResponse));
      return;
    }

    // create CityKey
    Key<CityEntity> cityKey =
        Key.create(CityEntity.class, Utils.md5(req.getParameter(API_PARAM_CITY_TEMPERATURE)));
    // query last 20 avaialble values
    DatastoreService<CityTemperature> dsCityTemperature =
        new DatastoreService<CityTemperature>(CityTemperature.class);
    final String filterKey = "<";
    Key<CityTemperature> filterValue =
        Key.create(CityTemperature.class, new java.util.Date().getTime());
    List<CityTemperature> citiesTemperature =
        dsCityTemperature.getByFilterKey(
            cityKey,
            filterKey,
            filterValue,
            true,
            Integer.parseInt(req.getParameter(API_PARAM_CITY_TEMPERATURE_NUM_RECORD)));

    resp.setContentType(com.google.common.net.MediaType.JSON_UTF_8.toString());
    restResponse.setCode(javax.servlet.http.HttpServletResponse.SC_OK);
    restResponse.setMessage(GSON.toJson(citiesTemperature));
    resp.setStatus(javax.servlet.http.HttpServletResponse.SC_OK);
    resp.getWriter().println(GSON.toJson(restResponse));

    return;
  }
}
