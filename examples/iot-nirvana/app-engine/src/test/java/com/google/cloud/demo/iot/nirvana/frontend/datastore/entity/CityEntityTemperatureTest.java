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

package com.google.cloud.demo.iot.nirvana.frontend.datastore.entity;

import static org.junit.Assert.assertTrue;

import com.google.cloud.demo.iot.nirvana.frontend.datastore.CityTemperature;
import org.junit.Test;
import org.junit.runner.RunWith;
import org.junit.runners.JUnit4;

/** Unit tests for {@link CityTemperature}. */
@RunWith(JUnit4.class)
public final class CityEntityTemperatureTest {

  @Test
  public void setId_resultOk() throws Exception {
    CityTemperature cityTemp = new CityTemperature();
    cityTemp.setId(98765421L);
    assertTrue(cityTemp.getId() == 98765421L);
  }

  @Test
  public void setTemperature_resultOkPositive() throws Exception {
    CityTemperature cityTemp = new CityTemperature();
    cityTemp.setTemperature(35.8);
    assertTrue(cityTemp.getTemperature() == 35.8);
  }

  @Test
  public void setTemperature_resultOkNegative() throws Exception {
    CityTemperature cityTemp = new CityTemperature();
    cityTemp.setTemperature(-35.8);
    assertTrue(cityTemp.getTemperature() == -35.8);
  }

}
