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
import org.apache.commons.cli.CommandLine;
import org.apache.commons.cli.CommandLineParser;
import org.apache.commons.cli.DefaultParser;
import org.apache.commons.cli.HelpFormatter;
import org.apache.commons.cli.Option;
import org.apache.commons.cli.Options;
import org.apache.commons.cli.ParseException;

/** Helper class that wraps of all the input configuration parameters of the client. */
@AutoValue
public abstract class ClientOptions {

  private static final String INPUT_PARAM_GCP_PROJECT_ID = "projectId";
  private static final String INPUT_PARAM_GCP_REGION = "region";
  private static final String INPUT_PARAM_CLOUD_IOT_REGISTRY_NAME = "registryName";
  private static final String INPUT_PARAM_RSA_CERTIFICATE_FILE_PATH = "rsaCertificateFilePath";
  private static final String INPUT_PARAM_PRIVATE_KEY = "privateKey";
  private static final String INPUT_PARAM_INDEX = "cityIndex";

  private CommandLine cmd = null;

  /** Builder for ClientOptions. */
  @AutoValue.Builder
  public abstract static class Builder {
    public abstract ClientOptions build();
  }

  public static Builder newBuilder() {
    return new AutoValue_ClientOptions.Builder();
  }

  /** Define all the input parameters. */
  private Options initOptions() {
    // Define input parameters one by one
    Option optGcpProjectId = new Option(INPUT_PARAM_GCP_PROJECT_ID, true, "GCP Project ID");
    optGcpProjectId.setRequired(true);
    Option optGcpRegion = new Option(INPUT_PARAM_GCP_REGION, true, "GCP region");
    optGcpRegion.setRequired(true);
    Option optRegistryName =
        new Option(INPUT_PARAM_CLOUD_IOT_REGISTRY_NAME, true, "Cloud IoT Core registry name");
    optRegistryName.setRequired(true);
    Option optRsaCertificateFilePath =
        new Option(INPUT_PARAM_RSA_CERTIFICATE_FILE_PATH, true, "RSA certificate file path");
    optRsaCertificateFilePath.setRequired(true);
    Option optPrivateKey = new Option(INPUT_PARAM_PRIVATE_KEY, true, "Private Key (PKCS8 format)");
    optPrivateKey.setRequired(true);
    Option optCityIndex = new Option(INPUT_PARAM_INDEX, true, "city index [0-18]");
    optCityIndex.setRequired(true);
    // Wrap all input parameters
    Options options = new Options();
    options.addOption(optGcpProjectId);
    options.addOption(optGcpRegion);
    options.addOption(optRegistryName);
    options.addOption(optRsaCertificateFilePath);
    options.addOption(optPrivateKey);
    options.addOption(optCityIndex);

    return options;
  }

  /** Parse command line input parameters. */
  public void parse(String args[]) throws ClientException {
    Options options = initOptions();
    try {
      CommandLineParser parser = new DefaultParser();
      cmd = parser.parse(options, args);
    } catch (ParseException e) {
      // Display command line parsing error
      HelpFormatter formatter = new HelpFormatter();
      formatter.printHelp("iot-core-device-simulator", options);
      throw new ClientException("Failed to parse input parameters", e);
    }
  }

  /** Returns the value of a String option read from the command line. */
  private String getStringOption(String optionName) throws ClientException {
    if (cmd != null) {
      return cmd.getOptionValue(optionName);
    } else {
      throw new ClientException(
          String.format(
              "Cannot retrieve value for parameter %s. Command line not parsed.", optionName));
    }
  }

  public String getGcpProjectId() throws ClientException {
    return getStringOption(ClientOptions.INPUT_PARAM_GCP_PROJECT_ID);
  }

  public String getGcpRegion() throws ClientException {
    return getStringOption(ClientOptions.INPUT_PARAM_GCP_REGION);
  }

  public String getRegistryName() throws ClientException {
    return getStringOption(ClientOptions.INPUT_PARAM_CLOUD_IOT_REGISTRY_NAME);
  }

  public String getRsaCertificateFilePath() throws ClientException {
    return getStringOption(ClientOptions.INPUT_PARAM_RSA_CERTIFICATE_FILE_PATH);
  }

  public String getPrivateKey() throws ClientException {
    return getStringOption(ClientOptions.INPUT_PARAM_PRIVATE_KEY);
  }

  public String getCityIndex() throws ClientException {
    return getStringOption(ClientOptions.INPUT_PARAM_INDEX);
  }
}
