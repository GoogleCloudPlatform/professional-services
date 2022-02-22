/*
 * Copyright (C) 2018 Google Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

package com.google.cloud.pso.pubsub;

import com.google.cloud.pso.Employee;
import com.google.cloud.pso.pubsub.common.ObjectReader;
import com.google.common.annotations.VisibleForTesting;
import org.apache.commons.lang.RandomStringUtils;
import org.apache.commons.lang.math.RandomUtils;

/** Implementation of {@link ObjectReader} to generate random {@link Employee} records. */
public class GenerateRandomEmployeeReader implements ObjectReader<Employee> {
  private static final int STRING_LEN_DEFAULT = 10;
  private long numOfMessages;
  private long currentCount;

  public GenerateRandomEmployeeReader(long numOfMessages) {
    this.currentCount = 0;
    this.numOfMessages = numOfMessages;
  }

  @Override
  public Employee next() {
    this.currentCount++;
    // Employee records are generated with a random id and 10 character name
    return getEmployee(
        RandomUtils.nextLong(), RandomStringUtils.randomAlphabetic(STRING_LEN_DEFAULT));
  }

  @Override
  public boolean hasNext() {
    return this.currentCount < this.numOfMessages;
  }

  @VisibleForTesting
  protected Employee getEmployee(Long id, String name) {
    return Employee.newBuilder().setId(id).setName(name).build();
  }
}
