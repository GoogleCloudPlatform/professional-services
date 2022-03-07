/**
 * Copyright (C) 2022 Google Inc.
 *
 * <p>Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file
 * except in compliance with the License. You may obtain a copy of the License at
 *
 * <p>http://www.apache.org/licenses/LICENSE-2.0
 *
 * <p>Unless required by applicable law or agreed to in writing, software distributed under the
 * License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either
 * express or implied. See the License for the specific language governing permissions and
 * limitations under the License.
 */
package com.example.gcpsupport;

import static org.junit.Assert.assertEquals;

import com.google.api.services.cloudsupport.v2beta.CloudSupport;
import com.google.api.services.cloudsupport.v2beta.model.CloseCaseRequest;
import com.google.api.services.cloudsupport.v2beta.model.CloudSupportCase;
import java.io.File;
import java.io.IOException;
import java.security.GeneralSecurityException;
import org.junit.After;
import org.junit.Before;
import org.junit.Test;

public class CreateCaseTest {

  private CloudSupportCase csc;

  @Before
  public void createCase() {

    String basePath = new File("").getAbsolutePath();
    String newCasePath = basePath + "/data/case.json";
    String parentResource = System.getenv("PARENT_RESOURCE");

    try {
      csc = CreateCase.createCase(parentResource, newCasePath);
    } catch (IOException e) {
      System.out.println("IOException caught! \n" + e);
    }
  }

  @After
  public void closeNewCase() {

    if (csc == null) return;

    try {
      String nameOfCase = csc.getName();

      CloudSupport supportService = Starter.getCloudSupportService();
      CloseCaseRequest request = new CloseCaseRequest();
      supportService.cases().close(nameOfCase, request).execute();

      csc = null;

    } catch (IOException e) {
      System.out.println("IOException caught! \n" + e);

    } catch (GeneralSecurityException e) {
      System.out.println("GeneralSecurityException caught! \n" + e);
    }
  }

  @Test
  public void createsCase_WithSameDescription() {

    String caseDisplayName = csc.getDisplayName().toLowerCase();
    String expectedDisplayName = "test case";
    assertEquals(expectedDisplayName, caseDisplayName);
  }
}
