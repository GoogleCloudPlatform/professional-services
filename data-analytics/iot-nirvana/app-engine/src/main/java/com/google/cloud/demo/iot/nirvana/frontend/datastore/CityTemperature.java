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

package com.google.cloud.demo.iot.nirvana.frontend.datastore;

import com.googlecode.objectify.Key;
import com.googlecode.objectify.annotation.Entity;
import com.googlecode.objectify.annotation.Id;
import com.googlecode.objectify.annotation.Parent;

/** Class that represents Datastore entity describing a temperature for city */
@Entity
public class CityTemperature {

  @Parent Key<CityEntity> city;
  @Id long id;
  double temperature;

  public CityTemperature() {
    ;
  }

  /**
   * The temperature of a city
   *
   * @param city reference to the parent entity (the CityEntity)
   * @param id the id of this temperature (UNIX epoch)
   * @param temperature the temperature of the city
   */
  public CityTemperature(Key<CityEntity> city, long id, double temperature) {
    this.city = city;
    this.id = id;
    this.temperature = temperature;
  }

  public Key<CityEntity> getCity() {
    return city;
  }

  public void setCity(Key<CityEntity> city) {
    this.city = city;
  }

  public long getId() {
    return id;
  }

  public void setId(long id) {
    this.id = id;
  }

  public double getTemperature() {
    return temperature;
  }

  public void setTemperature(double temperature) {
    this.temperature = temperature;
  }
}
