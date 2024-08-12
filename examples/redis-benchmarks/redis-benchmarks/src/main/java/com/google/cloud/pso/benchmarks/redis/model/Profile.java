/*
 * Copyright (C) 2024 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not
 * use this file except in compliance with the License. You may obtain a copy of
 * the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS, WITHOUT
 * WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the
 * License for the specific language governing permissions and limitations under
 * the License.
 */
package com.google.cloud.pso.benchmarks.redis.model;

import java.util.*;
import lombok.Data;

/**
 * Class {@link Profile} provides an implementation of {@link Payload} to be stored in the redis.
 */
@Data
public class Profile implements Payload<Profile> {
  private static final Random random = new Random();

  private String name;
  private double version;
  private List<Object> objectList;
  private Map<String, Object> kvpairs;

  public Profile() {
    objectList = new ArrayList<>();
    kvpairs = new HashMap<>();
  }

  @Override
  public Profile get() {
    Profile sampleMessage = new Profile();
    sampleMessage.name = "msgpack-" + random.nextInt(10);
    sampleMessage.version = 0.6;

    sampleMessage.objectList.add("Foo");
    sampleMessage.objectList.add("Bar");
    sampleMessage.objectList.add(42);

    sampleMessage.kvpairs.put("name", "john");
    sampleMessage.kvpairs.put("age", 42);
    return sampleMessage;
  }
}
