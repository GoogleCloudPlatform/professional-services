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

package com.google.cloud.demo.iot.nirvana.client;

import static org.junit.Assert.assertEquals;
import static org.junit.Assert.assertTrue;

import java.text.SimpleDateFormat;
import java.util.Date;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import org.junit.Before;
import org.junit.Test;
import org.junit.runner.RunWith;
import org.junit.runners.JUnit4;

/** Unit tests for {@link IotDeviceMgr}. */
@RunWith(JUnit4.class)
public final class IotDeviceMgrTest {

  private static final String DEVICE_ID = "dev-20180514-123ertfs-5kjl-67gh-lk9j-endloptrh48j2";
  private static final String IOT_CORE_REGISTRY_PATH =
      "projects/my-project/locations/us-central1-f/registries/my-registry";

  IotDeviceMgr deviceMgr;

  @Before
  public void setUp() throws Exception {
    String argsComplete[] = {
      "-projectId", "my-project",
      "-region", "us-central1-f",
      "-registryName", "my-registry",
      "-rsaCertificateFilePath", "/tmp/iot-core/rsa_cert_0.pem",
      "-privateKey", "/tmp/iot-core/rsa_private_0_pkcs8",
      "-cityIndex", "1"
    };
    ClientOptions options = ClientOptions.newBuilder().build();
    options.parse(argsComplete);
    deviceMgr =
        IotDeviceMgr.newBuilder()
            .setGcpProjectId(options.getGcpProjectId())
            .setGcpRegion(options.getGcpRegion())
            .setRegistryName(options.getRegistryName())
            .build();
  }

  @Test
  public void generateDeviceId_resultOk() throws Exception {
    SimpleDateFormat sdf = new SimpleDateFormat("yyyy-MM-dd");
    String deviceIdPattern =
        String.format(
            "^sensor-%s-[a-fA-F0-9]{8}-[a-fA-F0-9]{4}-[a-fA-F0-9]{4}-[a-fA-F0-9]{4}-[a-fA-F0-9]{12}$",
            sdf.format(new Date()));
    Pattern r = Pattern.compile(deviceIdPattern);
    Matcher m = r.matcher(deviceMgr.generateDeviceId());
    assertTrue(m.find());
  }

  @Test
  public void generateRegistryPath_resultOk() throws Exception {
    assertEquals(
        deviceMgr.generateRegistryPath(),
        "projects/my-project/locations/us-central1-f/registries/my-registry");
  }

  @Test
  public void generateDevicePath_resultOk() throws Exception {
    assertEquals(
        deviceMgr.generateDevicePath(DEVICE_ID, IOT_CORE_REGISTRY_PATH),
        "projects/my-project/locations/us-central1-f/registries/my-registry/"
            + "devices/dev-20180514-123ertfs-5kjl-67gh-lk9j-endloptrh48j2");
  }
}
