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

import com.google.auto.value.AutoValue;
import com.google.cloud.demo.iot.nirvana.common.City;
import com.google.cloud.demo.iot.nirvana.common.FormatException;
import com.google.cloud.demo.iot.nirvana.common.Message;
import com.google.cloud.demo.iot.nirvana.common.TemperatureUtils;
import com.google.cloud.logging.Logging;
import com.google.cloud.logging.LoggingOptions;
import com.google.gson.Gson;
import io.jsonwebtoken.JwtBuilder;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.SignatureAlgorithm;
import java.io.IOException;
import java.nio.file.Paths;
import java.security.KeyFactory;
import java.security.NoSuchAlgorithmException;
import java.security.spec.InvalidKeySpecException;
import java.security.spec.PKCS8EncodedKeySpec;
import org.eclipse.paho.client.mqttv3.MqttClient;
import org.eclipse.paho.client.mqttv3.MqttConnectOptions;
import org.eclipse.paho.client.mqttv3.MqttException;
import org.eclipse.paho.client.mqttv3.MqttMessage;
import org.eclipse.paho.client.mqttv3.persist.MemoryPersistence;
import org.joda.time.DateTime;

/** An IoT device sending temperature data to a device registry on Google Cloud IoT Core */
@AutoValue
public abstract class IotDevice {

  abstract String getDeviceId();

  abstract String getDevicePath();

  abstract String getGcpProjectId();

  abstract String getPrivateKey();

  abstract String getCityIndex();

  /** Builder for IotDevice. */
  @AutoValue.Builder
  public abstract static class Builder {
    public abstract Builder setDeviceId(String deviceId);

    public abstract Builder setDevicePath(String devicePath);

    public abstract Builder setGcpProjectId(String projectId);

    public abstract Builder setPrivateKey(String privateKey);

    public abstract Builder setCityIndex(String cityIndex);

    public abstract IotDevice build();
  }

  public static Builder newBuilder() {
    return new AutoValue_IotDevice.Builder();
  }

  static final Logging LOGGER = LoggingOptions.getDefaultInstance().getService();
  private static final Gson GSON = new Gson();

  private static final double MIN_DELTA = -0.05;
  private static final double MAX_DELTA = 0.05;
  private static final int DEFAULT_QOS = 1;
  private static final String CLOUD_IOT_CORE_MQTT_BRIDGE_HOST_NAME = "mqtt.googleapis.com";
  private static final short CLOUD_IOT_CORE_MQTT_BRIDGE_PORT = 8883;

  /** Publish messages continuously to Cloud IoT Core. */
  public void publish() throws ClientException, FormatException {
    // Load city metadata and start publishing messages
    int cityIndex = Integer.parseInt(getCityIndex());
    City city = TemperatureUtils.loadCity(cityIndex);
    publishMessages(city);
  }

  /**
   * Generate and publish a temperature messages to Cloud IoT Core with a 10% variance around a
   * given temperature value and with a frequency of 1 message/second.
   */
  private void publishMessages(City city) throws ClientException, FormatException {
    try {
      String mqttTopic = generateMqttTopic();
      MqttClient client = createAndConnectMqttClient();
      while (true) {
        // Create the temperature message to publish
        double variance = MIN_DELTA + (Math.random() * MAX_DELTA);
        Message msg =
            Message.newBuilder()
                .setId(TemperatureUtils.generateCityKey(city))
                .setTemperature(city.getAvgTemperature() + variance)
                .setTimestamp(new java.util.Date().getTime())
                .build();

        // Create the MQTT message (in this case QoS=1 --> delivered at least once)
        String payload = GSON.toJson(msg);
        MqttMessage mqttMessage = new MqttMessage(payload.getBytes());
        mqttMessage.setQos(DEFAULT_QOS);

        // Publish the message and sleep for 1 second
        client.publish(mqttTopic, mqttMessage);
        LogUtils.logDebug(
            LOGGER,
            getDeviceId(),
            getGcpProjectId(),
            String.format("Message published: %s", mqttMessage));
        try {
          Thread.sleep(1000);
        } catch (InterruptedException e) {;
        }
      }
    } catch (MqttException e) {
      String message = String.format("Failed to send messages. Cause: %s", e.getMessage());
      LogUtils.logDebug(LOGGER, getDeviceId(), getGcpProjectId(), message);
      throw new ClientException(message, e);
    }
  }

  /** Create a Cloud IoT Core MQTT client and connect to the server. */
  private MqttClient createAndConnectMqttClient() throws ClientException {
    try {
      // Cloud IoT core supports only MQTT 3.1.1
      MqttConnectOptions connectOptions = new MqttConnectOptions();
      connectOptions.setMqttVersion(MqttConnectOptions.MQTT_VERSION_3_1_1);
      connectOptions.setUserName("notused");
      connectOptions.setPassword(createJwtRsa().toCharArray());
      // Create a client, and connect to the Google MQTT bridge with the defined options
      MqttClient client =
          new MqttClient(generateMqttServerAddress(), getDevicePath(), new MemoryPersistence());
      client.connect(connectOptions);
      return client;
    } catch (MqttException e) {
      String message =
          String.format("Failed to connect to the IoT server. Cause: %s", e.getMessage());
      LogUtils.logDebug(LOGGER, getDeviceId(), getGcpProjectId(), message);
      throw new ClientException(message, e);
    }
  }

  /** Build the endpoint of the MQTT Cloud IoT Core server. */
  String generateMqttServerAddress() {
    return String.format(
        "ssl://%s:%s", CLOUD_IOT_CORE_MQTT_BRIDGE_HOST_NAME, CLOUD_IOT_CORE_MQTT_BRIDGE_PORT);
  }

  /**
   * Create a JWT to authenticate this device. The device will be disconnected after the token
   * expires, and will have to reconnect with a new token. The audience field should always be set
   * to the GCP project id.
   */
  String createJwtRsa() throws ClientException {
    try {
      DateTime now = new DateTime();
      JwtBuilder jwtBuilder =
          Jwts.builder()
              .setIssuedAt(now.toDate())
              .setExpiration(now.plusMinutes(20).toDate())
              .setAudience(getGcpProjectId());
      byte[] keyBytes = java.nio.file.Files.readAllBytes(Paths.get(getPrivateKey()));
      PKCS8EncodedKeySpec spec = new PKCS8EncodedKeySpec(keyBytes);
      KeyFactory kf = KeyFactory.getInstance("RSA");
      return jwtBuilder.signWith(SignatureAlgorithm.RS256, kf.generatePrivate(spec)).compact();
    } catch (IOException e) {
      String message = String.format("Cannot create JWT. Cause: %s", e.getMessage());
      LogUtils.logDebug(LOGGER, getDeviceId(), getGcpProjectId(), message);
      throw new ClientException(message, e);
    } catch (NoSuchAlgorithmException e) {
      String message = String.format("Cannot create JWT. Cause: %s", e.getMessage());
      LogUtils.logDebug(LOGGER, getDeviceId(), getGcpProjectId(), message);
      throw new ClientException(message, e);
    } catch (InvalidKeySpecException e) {
      String message = String.format("Cannot create JWT. Cause: %s", e.getMessage());
      LogUtils.logDebug(LOGGER, getDeviceId(), getGcpProjectId(), message);
      throw new ClientException(message, e);
    }
  }

  /** Create the MQTT topic on which the device will publish messages to Cloud IoT Core. */
  String generateMqttTopic() {
    return String.format("/devices/%s/events", getDeviceId());
  }
}
