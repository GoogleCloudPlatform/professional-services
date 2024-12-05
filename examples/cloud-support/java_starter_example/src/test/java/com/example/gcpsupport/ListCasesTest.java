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

import static org.junit.Assert.assertTrue;

import com.google.api.services.cloudsupport.v2beta.model.CloudSupportCase;
import java.io.IOException;
import java.util.List;
import org.junit.Test;

public class ListCasesTest {

  @Test
  public void fetches_AllCases() {

    try {
      String parentResource = System.getenv("PARENT_RESOURCE");

      List<CloudSupportCase> cases = ListCases.listAllCases(parentResource);

      assertTrue(cases.size() > 1);

    } catch (IOException e) {
      System.out.println("IOException caught! \n" + e);
    }
  }
}
