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

import static org.hamcrest.CoreMatchers.equalTo;
import static org.hamcrest.CoreMatchers.is;
import static org.hamcrest.MatcherAssert.assertThat;

import com.google.cloud.pso.Employee;
import org.junit.Before;
import org.junit.Test;
import org.junit.runner.RunWith;
import org.junit.runners.JUnit4;

/**
 * Tests for {@link GenerateRandomEmployeeReader}
 * */
@RunWith(JUnit4.class)
public class GenerateRandomEmployeeReaderTest {
  private GenerateRandomEmployeeReader reader;
  private Employee expectedEmployee;
  private static final Long EMP_ID = 1234L;
  private static final String EMP_NAME = "John";

  @Before
  public void setup() {
    reader = new GenerateRandomEmployeeReader(1);
    expectedEmployee = Employee.newBuilder().setId(EMP_ID).setName(EMP_NAME).build();
  }

  @Test
  public void testGetEmployee() {
    assertThat(expectedEmployee, is(equalTo(reader.getEmployee(EMP_ID, EMP_NAME))));
  }
}
