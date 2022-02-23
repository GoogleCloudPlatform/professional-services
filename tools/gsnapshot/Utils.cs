/*
   Copyright 2022 Google LLC

   Licensed under the Apache License, Version 2.0 (the "License");
   you may not use this file except in compliance with the License.
   You may obtain a copy of the License at

       http://www.apache.org/licenses/LICENSE-2.0

   Unless required by applicable law or agreed to in writing, software
   distributed under the License is distributed on an "AS IS" BASIS,
   WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   See the License for the specific language governing permissions and
   limitations under the License.
*/
using System;
using System.Diagnostics;
using System.Threading.Tasks;
using System.Collections.Generic;
using System.Text.RegularExpressions;
using Microsoft.Extensions.Logging;
using Google.Apis.Auth.OAuth2;
using Google.Apis.Compute.v1;
using Google.Apis.CloudResourceManager.v1;
using Google.Apis.Services;
using Newtonsoft.Json;
using ByteSizeLib;

using ComputeData = Google.Apis.Compute.v1.Data;
using CrmData = Google.Apis.CloudResourceManager.v1.Data;

#nullable enable
#pragma warning disable CS1998
namespace GSnapshot {
  public class Utils {
    private readonly ILogger<Runner> _logger;
    public static string Version = "1.2.0";
    public static string ApplicationName = $"google-pso-tool/gsnapshot/{Version}";

    public Utils(ILogger<Runner> logger) {
      _logger = logger;
    }

    // Returns the last part of the string after a slash
    public string GetLastPart(string s) {
      string[] sParts = s.Split('/');
      return sParts[sParts.Length - 1];
    }

    // Returns the Nth part of string when split by slashes
    public string GetLastPartN(string s, int index) {
      string[] sParts = s.Split('/');
      return sParts[sParts.Length - index];
    }

    // Formats errors from Cloud APIs
    public static string FormatErrors(IList<ComputeData.Operation.ErrorData.ErrorsData> errors) {
      string ret = "";
      foreach (ComputeData.Operation.ErrorData.ErrorsData error in errors) {
        ret += $"  Code: {error.Code}\n";
        ret += $"  Message: {error.Message}\n";
      }
      return ret;
    }

    // To be or not to be
    public bool GetYesNo(string prompt, bool defaultValue) {
      string input = ReadLine.Read($"{prompt}> ");
      if (String.IsNullOrEmpty(input)) {
        return defaultValue;
      }
      if (input.ToLower() == "n" || input.ToLower() == "no" || input.ToLower() == "f" ||
          input.ToLower() == "0") {
        return false;
      }
      if (input.ToLower() == "y" || input.ToLower() == "yes" || input.ToLower() == "t" ||
          input.ToLower() == "1") {
        return true;
      }
      return defaultValue;
    }

    // Attempts to run gcloud command
    public string? RunGcloud(string arguments) {
      Process p = new Process();
      p.StartInfo.UseShellExecute = false;
      p.StartInfo.RedirectStandardOutput = true;
      p.StartInfo.RedirectStandardError = true;
      p.StartInfo.FileName = "gcloud";
      p.StartInfo.Arguments = arguments;
      try {
        p.Start();
        p.WaitForExit();
        string output = p.StandardOutput.ReadToEnd().Trim(null);
        if (!String.IsNullOrEmpty(output)) {
          return output;
        }
      } catch (Exception) {
      }
      return null;
    }

    // Returns scoped credentials
    public static GoogleCredential GetCredential() {
      GoogleCredential credential =
          Task.Run(() => GoogleCredential.GetApplicationDefaultAsync()).Result;
      if (credential.IsCreateScopedRequired) {
        credential = credential.CreateScoped("https://www.googleapis.com/auth/cloud-platform");
      } return credential;
    }
  }
}