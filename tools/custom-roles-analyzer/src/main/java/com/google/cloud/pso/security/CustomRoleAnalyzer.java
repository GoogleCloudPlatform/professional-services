/*
Copyright 2022 Google LLC

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

    https://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
*/

package com.google.cloud.pso.security;

import com.google.cloud.pso.security.constants.GenericConstants;
import com.google.cloud.pso.security.util.CustomRoleAnalyzerHelper;
import com.google.common.flogger.GoogleLogger;
import java.util.Arrays;
import java.util.List;

/** Main class. */
public class CustomRoleAnalyzer {

  private static final GoogleLogger logger = GoogleLogger.forEnclosingClass();

  public static void main(String[] args) {

    String orgId = "";
    String resultFormat = GenericConstants.DEFAULT_FORMAT;

    List<String> commandlineArgs = null;
    if (args != null && args.length > 0) {
      commandlineArgs = Arrays.asList(args);
    } else {
      logger.atInfo().log(GenericConstants.OPTIONS_HELP);
      System.exit(1);
    }
    if (commandlineArgs.contains("-o")
        && commandlineArgs.size() > (commandlineArgs.indexOf("-o") + 1)) {
      orgId = (String) commandlineArgs.get(commandlineArgs.indexOf("-o") + 1);
    } else {
      logger.atInfo().log(GenericConstants.OPTIONS_HELP);
      System.exit(1);
    }
    if (commandlineArgs.contains("-f")
        && commandlineArgs.size() > (commandlineArgs.indexOf("-o") + 1)) {
      resultFormat = (String) commandlineArgs.get(commandlineArgs.indexOf("-f") + 1);
      if (!resultFormat.equals(GenericConstants.JSON_FORMAT)
          || !resultFormat.equals(GenericConstants.DEFAULT_FORMAT)) {
        logger.atWarning().log("Unsupported format: " + resultFormat);
        logger.atInfo().log("Using defualt format: " + GenericConstants.DEFAULT_FORMAT);
        resultFormat = GenericConstants.DEFAULT_FORMAT;
      }
    }
    logger.atInfo().log("Staring custom role analysis for org : " + orgId);

    CustomRoleAnalyzerHelper analyzerHelper = new CustomRoleAnalyzerHelper();
    analyzerHelper.initilize(orgId, resultFormat);

    analyzerHelper.processOrgLevelCustomRoles(orgId);
    analyzerHelper.processProjectLevelCustomRoles(orgId);
  }
}
