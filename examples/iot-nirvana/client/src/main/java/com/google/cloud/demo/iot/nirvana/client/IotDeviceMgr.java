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

import com.google.api.client.googleapis.auth.oauth2.GoogleCredential;
import com.google.api.client.googleapis.javanet.GoogleNetHttpTransport;
import com.google.api.client.http.HttpRequestInitializer;
import com.google.api.client.json.JsonFactory;
import com.google.api.client.json.jackson2.JacksonFactory;
import com.google.api.client.util.Charsets;
import com.google.api.services.cloudiot.v1.CloudIot;
import com.google.api.services.cloudiot.v1.CloudIotScopes;
import com.google.api.services.cloudiot.v1.model.Device;
import com.google.api.services.cloudiot.v1.model.DeviceCredential;
import com.google.api.services.cloudiot.v1.model.PublicKeyCredential;
import com.google.auto.value.AutoValue;
import com.google.cloud.logging.Logging;
import com.google.cloud.logging.LoggingOptions;
import com.google.common.io.Files;
import java.io.File;
import java.io.IOException;
import java.security.GeneralSecurityException;
import java.text.SimpleDateFormat;
import java.util.Arrays;
import java.util.Date;
import java.util.UUID;

/**
 * IoT Device manager class in charge of creating and registering a device in a Cloud IoT Core
 * registry
 */
@AutoValue
public abstract class IotDeviceMgr {

  abstract String getGcpProjectId();

  abstract String getGcpRegion();

  abstract String getRegistryName();

  /** Builder for IotDeviceMgr. */
  @AutoValue.Builder
  public abstract static class Builder {
    public abstract Builder setGcpProjectId(String projectId);

    public abstract Builder setGcpRegion(String region);

    public abstract Builder setRegistryName(String registryName);

    public abstract IotDeviceMgr build();
  }

  public static Builder newBuilder() {
    return new AutoValue_IotDeviceMgr.Builder();
  }

  static final Logging LOGGER = LoggingOptions.getDefaultInstance().getService();

  private static final String APP_NAME_API = "iot-device-simulator";
  private static final String KEY_FORMAT_RSA_X509_PEM = "RSA_X509_PEM";
  private static final String DEVICE_MGR_LOGGING_RESOURCE = "iot-device-mgr";

  /**
   * Create a new IoT device and register it in a Cloud IoT Core registry.
   *
   * @param rsaCertificateFilePath Path to the file containing the device certificate
   * @param privateKey Path to the file containing the device private key
   * @param cityIndex Index of the city for which to generate temperatures
   * @return device, instance of {@link IotDevice}
   * @throws ClientException
   */
  public IotDevice newRegisteredDevice(
      String rsaCertificateFilePath, String privateKey, String cityIndex) throws ClientException {
    String deviceId = generateDeviceId();
    String iotCoreRegistryPath = generateRegistryPath();
    IotDevice device =
        IotDevice.newBuilder()
            .setDeviceId(deviceId)
            .setDevicePath(generateDevicePath(deviceId, iotCoreRegistryPath))
            .setCityIndex(cityIndex)
            .setPrivateKey(privateKey)
            .setGcpProjectId(getGcpProjectId())
            .build();
    registerDevice(device, iotCoreRegistryPath, rsaCertificateFilePath);
    return device;
  }

  /**
   * Generate a new device id based on the current date.
   *
   * @return device unique identifier
   */
  String generateDeviceId() {
    SimpleDateFormat sdf = new SimpleDateFormat("yyyy-MM-dd");
    return String.format("sensor-%s-%s", sdf.format(new Date()), UUID.randomUUID().toString());
  }

  /**
   * Create the canonical IoT Core registry path on GCP.
   *
   * @return IoT Core registry path in the form
   *     projects/[PROJECT_ID]/locations/[LOCATION]/registries/[REGISTRY_NAME]
   */
  String generateRegistryPath() {
    return String.format(
        "projects/%s/locations/%s/registries/%s",
        getGcpProjectId(), getGcpRegion(), getRegistryName());
  }

  /**
   * Create the canonical device path in the IoT Core registry on GCP.
   *
   * @param deviceId Device unique identifier
   * @param iotCoreRegistryPath IoT Core registry path
   * @return device canonical path in the form
   *     projects/[PROJECT_ID]/locations/[LOCATION]/registries/[REGISTRY_NAME]/devices/[DEVICE_ID]
   */
  String generateDevicePath(String deviceId, String iotCoreRegistryPath) {
    return String.format("%s/devices/%s", iotCoreRegistryPath, deviceId);
  }

  /**
   * Register a device in a IoT Core registry
   *
   * @param iotDevice Device to register
   * @param iotCoreRegistryPath IoT Core registry in which to register the device
   * @param rsaCertificateFilePath Path to the file containing the device certificate
   * @throws ClientException
   */
  private void registerDevice(
      IotDevice iotDevice, String iotCoreRegistryPath, String rsaCertificateFilePath)
      throws ClientException {
    try {
      LogUtils.logDebug(
          LOGGER,
          DEVICE_MGR_LOGGING_RESOURCE,
          getGcpProjectId(),
          "Registering Cloud IoT device...");
      DeviceCredential credentials = loadCredentials(rsaCertificateFilePath);
      Device device = new Device();
      device.setId(iotDevice.getDeviceId());
      device.setCredentials(Arrays.asList(credentials));
      CloudIot cloudIotService = createCloudIotService();
      Device registeredDevice =
          cloudIotService
              .projects()
              .locations()
              .registries()
              .devices()
              .create(iotCoreRegistryPath, device)
              .execute();
      LogUtils.logDebug(
          LOGGER,
          DEVICE_MGR_LOGGING_RESOURCE,
          getGcpProjectId(),
          String.format("Cloud IoT device registered.\n%s", registeredDevice.toPrettyString()));
    } catch (IOException e) {
      String message = String.format("Failed to register device. Cause: %s", e.getMessage());
      LogUtils.logError(LOGGER, DEVICE_MGR_LOGGING_RESOURCE, getGcpProjectId(), message);
      throw new ClientException(message, e);
    }
  }

  /**
   * Read the device certificate and generate device credentials.
   *
   * @param rsaCertificateFilePath Path to the file containing the device certificate
   * @return Device credentials loaded from the certificate file, instance of {@link
   *     DeviceCredential}
   * @throws ClientException
   */
  private DeviceCredential loadCredentials(String rsaCertificateFilePath) throws ClientException {
    try {
      PublicKeyCredential publicKeyCredential = new PublicKeyCredential();
      String key = Files.toString(new File(rsaCertificateFilePath), Charsets.UTF_8);
      publicKeyCredential.setKey(key);
      publicKeyCredential.setFormat(KEY_FORMAT_RSA_X509_PEM);
      DeviceCredential deviceCredential = new DeviceCredential();
      deviceCredential.setPublicKey(publicKeyCredential);
      return deviceCredential;
    } catch (IOException e) {
      String message =
          String.format("Failed to load device credentials. Cause : %s", e.getMessage());
      LogUtils.logError(LOGGER, DEVICE_MGR_LOGGING_RESOURCE, getGcpProjectId(), message);
      throw new ClientException(message, e);
    }
  }

  /**
   * Generate the Cloud IoT Core service.
   *
   * @return Instance of {@link CloudIot}
   * @throws ClientException
   */
  private CloudIot createCloudIotService() throws ClientException {
    try {
      GoogleCredential credential =
          GoogleCredential.getApplicationDefault().createScoped(CloudIotScopes.all());
      JsonFactory jsonFactory = JacksonFactory.getDefaultInstance();
      HttpRequestInitializer init = new RetryHttpInitializerWrapper(credential);
      CloudIot service =
          new CloudIot.Builder(GoogleNetHttpTransport.newTrustedTransport(), jsonFactory, init)
              .setApplicationName(APP_NAME_API)
              .build();
      return service;
    } catch (IOException e) {
      String message =
          String.format("Failed to create Cloud IoT Core service. Cause : %s", e.getMessage());
      LogUtils.logError(LOGGER, DEVICE_MGR_LOGGING_RESOURCE, getGcpProjectId(), message);
      throw new ClientException(message, e);
    } catch (GeneralSecurityException e) {
      String message =
          String.format("Failed to create Cloud IoT Core service. Cause : %s", e.getMessage());
      LogUtils.logError(LOGGER, DEVICE_MGR_LOGGING_RESOURCE, getGcpProjectId(), message);
      throw new ClientException(message, e);
    }
  }
}
