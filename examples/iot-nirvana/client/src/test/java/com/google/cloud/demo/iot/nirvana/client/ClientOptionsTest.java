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

import static com.google.common.truth.Truth.assertThat;
import static org.junit.Assert.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;

import org.junit.Test;
import org.junit.runner.RunWith;
import org.junit.runners.JUnit4;

/** Unit tests for {@link ClientOptions}. */
@RunWith(JUnit4.class)
public final class ClientOptionsTest {

  private static final String ARGS_INCOMPLETE[] = {
    "-region", "us-central1-f",
    "-registryName", "my-registry",
    "-rsaCertificateFilePath", "/tmp/iot-core/rsa_cert_0.pem",
    "-privateKey", "/tmp/iot-core/rsa_private_0_pkcs8",
    "-cityIndex", "1"
  };

  private static final String ARGS_COMPLETE[] = {
    "-projectId", "my-project",
    "-region", "us-central1-f",
    "-registryName", "my-registry",
    "-rsaCertificateFilePath", "/tmp/iot-core/rsa_cert_0.pem",
    "-privateKey", "/tmp/iot-core/rsa_private_0_pkcs8",
    "-cityIndex", "1"
  };

  @Test
  public void parse_exceptionThrownArgsEmpty() throws Exception {
    ClientOptions options = ClientOptions.newBuilder().build();
    String args[] = new String[0];
    ClientException thrown =
        assertThrows(ClientException.class, () -> options.parse(ARGS_INCOMPLETE));
    assertThat(thrown).hasMessageThat().contains("Failed to parse input parameters");
  }

  @Test
  public void parse_exceptionThrownArgsIncomplete() throws Exception {
    ClientOptions options = ClientOptions.newBuilder().build();
    ClientException thrown =
        assertThrows(ClientException.class, () -> options.parse(ARGS_INCOMPLETE));
    assertThat(thrown).hasMessageThat().contains("Failed to parse input parameters");
  }

  @Test
  public void getGcpProjectId_resultOk() throws Exception {
    ClientOptions options = ClientOptions.newBuilder().build();
    options.parse(ARGS_COMPLETE);
    assertEquals(options.getGcpProjectId(), "my-project");
  }

  @Test
  public void getGcpProjectId_exceptionThrown() throws Exception {
    ClientOptions options = ClientOptions.newBuilder().build();
    ClientException thrown = assertThrows(ClientException.class, () -> options.getGcpProjectId());
    assertThat(thrown)
        .hasMessageThat()
        .contains("Cannot retrieve value for parameter projectId. Command line not parsed.");
  }

  @Test
  public void getGcpRegion_resultOk() throws Exception {
    ClientOptions options = ClientOptions.newBuilder().build();
    options.parse(ARGS_COMPLETE);
    assertEquals(options.getGcpRegion(), "us-central1-f");
  }

  @Test
  public void getGcpRegion_exceptionThrown() throws Exception {
    ClientOptions options = ClientOptions.newBuilder().build();
    ClientException thrown = assertThrows(ClientException.class, () -> options.getGcpRegion());
    assertThat(thrown)
        .hasMessageThat()
        .contains("Cannot retrieve value for parameter region. Command line not parsed.");
  }

  @Test
  public void getRegistryName_resultOk() throws Exception {
    ClientOptions options = ClientOptions.newBuilder().build();
    options.parse(ARGS_COMPLETE);
    assertEquals(options.getRegistryName(), "my-registry");
  }

  @Test
  public void getRegistryName_exceptionThrown() throws Exception {
    ClientOptions options = ClientOptions.newBuilder().build();
    ClientException thrown = assertThrows(ClientException.class, () -> options.getRegistryName());
    assertThat(thrown)
        .hasMessageThat()
        .contains("Cannot retrieve value for parameter registryName. Command line not parsed.");
  }

  @Test
  public void getRsaCertificateFilePath_resultOk() throws Exception {
    ClientOptions options = ClientOptions.newBuilder().build();
    options.parse(ARGS_COMPLETE);
    assertEquals(options.getRsaCertificateFilePath(), "/tmp/iot-core/rsa_cert_0.pem");
  }

  @Test
  public void getRsaCertificateFilePath_exceptionThrown() throws Exception {
    ClientOptions options = ClientOptions.newBuilder().build();
    ClientException thrown =
        assertThrows(ClientException.class, () -> options.getRsaCertificateFilePath());
    assertThat(thrown)
        .hasMessageThat()
        .contains(
            "Cannot retrieve value for parameter rsaCertificateFilePath. Command line not parsed.");
  }

  @Test
  public void getPrivateKey_resultOk() throws Exception {
    ClientOptions options = ClientOptions.newBuilder().build();
    options.parse(ARGS_COMPLETE);
    assertEquals(options.getPrivateKey(), "/tmp/iot-core/rsa_private_0_pkcs8");
  }

  @Test
  public void getPrivateKey_exceptionThrown() throws Exception {
    ClientOptions options = ClientOptions.newBuilder().build();
    ClientException thrown = assertThrows(ClientException.class, () -> options.getPrivateKey());
    assertThat(thrown)
        .hasMessageThat()
        .contains("Cannot retrieve value for parameter privateKey. Command line not parsed.");
  }

  @Test
  public void getCityIndex_resultOk() throws Exception {
    ClientOptions options = ClientOptions.newBuilder().build();
    options.parse(ARGS_COMPLETE);
    assertEquals(options.getCityIndex(), "1");
  }

  @Test
  public void getCityIndex_exceptionThrown() throws Exception {
    ClientOptions options = ClientOptions.newBuilder().build();
    ClientException thrown = assertThrows(ClientException.class, () -> options.getCityIndex());
    assertThat(thrown)
        .hasMessageThat()
        .contains("Cannot retrieve value for parameter cityIndex. Command line not parsed.");
  }
}
