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

import static org.junit.Assert.assertEquals;
import static org.junit.Assert.assertTrue;

import com.google.cloud.demo.iot.nirvana.common.City;
import com.google.cloud.demo.iot.nirvana.frontend.datastore.CityEntity;
import org.junit.Test;
import org.junit.runner.RunWith;
import org.junit.runners.JUnit4;

/** Unit tests for {@link CityEntity}. */
@RunWith(JUnit4.class)
public final class CityEntityTest {

  @Test
  public void constructor_resultOk() throws Exception {
    CityEntity cityEntity = new CityEntity(
        "8762723AE028CAA144CBF8B7069003C3",
        City.newBuilder()
            .setCity("Paris")
            .setLat(41.3275459)
            .setLng(19.81869819999997)
            .setAvgTemperature(31.0)
            .build());
    assertEquals(cityEntity.getId(), "8762723AE028CAA144CBF8B7069003C3");
    assertEquals(cityEntity.getName(), "Paris");
    assertTrue(cityEntity.getLat() == 41.3275459);
    assertTrue(cityEntity.getLng() == 19.81869819999997);
    assertTrue(cityEntity.getAvgTemperature() == 31.0);
  }
}
