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

import com.google.cloud.demo.iot.nirvana.common.City;
import com.googlecode.objectify.annotation.Entity;
import com.googlecode.objectify.annotation.Id;

/** Class that represents Datastore entity describing a city */
@Entity
public class CityEntity {

  @Id String id;
  String name;
  double lat;
  double lng;
  double avgTemperature; // this is the average temperature of the city during the year

  public CityEntity() {}

  public CityEntity(String id, City city) {
    this.id = id;
    this.lat = city.getLat();
    this.lng = city.getLng();
    this.name = city.getCity();
    this.avgTemperature = city.getAvgTemperature();
  }

  public String getName() {
    return name;
  }

  public double getLat() {
    return lat;
  }

  public double getLng() {
    return lng;
  }

  public String getId() {
    return id;
  }

  public double getAvgTemperature() {
    return avgTemperature;
  }
}
