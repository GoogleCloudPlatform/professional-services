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

package com.google.cloud.demo.iot.nirvana.common;

import com.google.common.io.Resources;
import java.io.IOException;
import java.io.UnsupportedEncodingException;
import java.net.URL;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.util.HashMap;
import java.util.Map;
import org.apache.commons.codec.binary.Hex;

/** Helper class to generate cities test data */
public class TemperatureUtils {

  private static final String CITIES_FILE_PATH = "cities.json";

  private static final String GENERATE_KEY_ERR = "Cannot generate key for id %s. Cause: %s";

  private static final String READ_FILE_ERR = "Cannot load content of resource file %s. Cause: %s";

  /**
   * Create a test dataset of cities and return it as a map whose key is the MD5 of the latitude and
   * longitude of the city
   */
  public static Map<String, City> loadCities() throws FormatException {
    String citiesJson = loadJsonFromFile();
    City.Builder[] cities = City.fromJsonArray(citiesJson);
    Map<String, City> citiesMap = new HashMap<>();
    for (City.Builder cityBuilder : cities) {
      City city = cityBuilder.build();
      String key = generateCityKey(city);
      citiesMap.put(key, city);
    }
    return citiesMap;
  }

  /** Load a city from the cities test dataset based on its index in the dataset */
  public static City loadCity(int cityIndex) throws FormatException {
    String citiesJson = loadJsonFromFile();
    City.Builder[] cities = City.fromJsonArray(citiesJson);
    return cities[cityIndex].build();
  }

  /** Load the list of cities in JSON format from the configuration file */
  static String loadJsonFromFile() throws FormatException {
    String jsonContent;
    try {
      URL resource = Resources.getResource(CITIES_FILE_PATH);
      jsonContent = Resources.toString(resource, StandardCharsets.UTF_8);
    } catch (IOException e) {
      String message = String.format(READ_FILE_ERR, CITIES_FILE_PATH, e.getMessage());
      throw new FormatException(message, e);
    }
    return jsonContent;
  }

  /**
   * Generate the Cloud Datastore unique identifier for a city
   *
   * @param city City for which to generate the unique identifier
   * @return String containing the Cloud Datastore uiquer identifier
   * @throws FormatException
   */
  public static String generateCityKey(City city) throws FormatException {
    String key;
    String id = city.getLat() + "-" + city.getLng();
    try {
      MessageDigest md = MessageDigest.getInstance("MD5");
      key = new String(Hex.encodeHex(md.digest(id.getBytes("UTF-8")))).toUpperCase();
    } catch (NoSuchAlgorithmException e) {
      String message = String.format(GENERATE_KEY_ERR, id, e.getMessage());
      throw new FormatException(message, e);
    } catch (UnsupportedEncodingException e) {
      String message = String.format(GENERATE_KEY_ERR, id, e.getMessage());
      throw new FormatException(message, e);
    }
    return key;
  }
}
