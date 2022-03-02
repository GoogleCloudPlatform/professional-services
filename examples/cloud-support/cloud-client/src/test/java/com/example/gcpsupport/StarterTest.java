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

import static org.junit.Assert.assertNotNull;
import static org.junit.Assert.assertTrue;

import com.google.api.services.cloudsupport.v2beta.CloudSupport;
import java.io.IOException;
import java.security.GeneralSecurityException;
import org.junit.Test;

public class StarterTest {

  @Test
  public void getCloudSupportService_ShouldNotReturn_Null() {
    try {
      CloudSupport cloudSupport = Starter.getCloudSupportService();
      assertNotNull(cloudSupport);
    } catch (IOException e) {
      System.out.println("IOException caught! \n" + e);

    } catch (GeneralSecurityException e) {
      System.out.println("GeneralSecurityException caught! \n" + e);
    }
  }

  @Test
  public void getCloudSupportService_ShouldReturn_CloudSupport() {
    try {
      CloudSupport cloudSupport = Starter.getCloudSupportService();
      boolean b = cloudSupport instanceof CloudSupport;
      assertTrue(b);
    } catch (IOException e) {
      System.out.println("IOException caught! \n" + e);

    } catch (GeneralSecurityException e) {
      System.out.println("GeneralSecurityException caught! \n" + e);
    }
  }
}
