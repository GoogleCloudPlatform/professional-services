package com.google.cloud.demo.iot.nirvana.client;

import static org.junit.Assert.assertEquals;

import org.junit.Before;
import org.junit.Test;
import org.junit.runner.RunWith;
import org.junit.runners.JUnit4;

/** Unit tests for {@link IotDevice}. */
@RunWith(JUnit4.class)
public final class IotDeviceTest {

  IotDevice iotDevice;

  private static final String DEVICE_ID = "dev-20180514-123ertfs-5kjl-67gh-lk9j-endloptrh48j2";
  private static final String DEVICE_PATH =
      "projects/my-project/locations/us-central1-f/registries/my-registry/devices/"
          + "dev-20180514-123ertfs-5kjl-67gh-lk9j-endloptrh48j2";

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
    iotDevice =
        IotDevice.newBuilder()
            .setDeviceId(DEVICE_ID)
            .setDevicePath(DEVICE_PATH)
            .setGcpProjectId(options.getGcpProjectId())
            .setCityIndex(options.getCityIndex())
            .setPrivateKey(options.getPrivateKey())
            .build();
  }

  @Test
  public void generateMqttTopic_resultOk() throws Exception {
    assertEquals(
        iotDevice.generateMqttTopic(),
        "/devices/dev-20180514-123ertfs-5kjl-67gh-lk9j-endloptrh48j2/events");
  }

  @Test
  public void generateMqttServerAddress_resultOk() throws Exception {
    assertEquals(iotDevice.generateMqttServerAddress(), "ssl://mqtt.googleapis.com:8883");
  }
}
