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
  public class Operations {
    private readonly ILogger<Runner> _logger;

    private ComputeService computeService = new ComputeService(new BaseClientService.Initializer {
      HttpClientInitializer = Utils.GetCredential(),
      ApplicationName = Utils.ApplicationName,
    });

    public Dictionary<string, string> AllRegions = new Dictionary<string, string>();
    public Dictionary<string, List<string>> AllZones = new Dictionary<string, List<string>>();
    public Dictionary<string, ComputeData.Instance> AllInstances =
        new Dictionary<string, ComputeData.Instance>();

    public const string GLOBAL = "global";
    public const string REGION = "region";
    public const string ZONE = "zone";

    public Operations(ILogger<Runner> logger) {
      _logger = logger;
    }

    public bool HandleOperationResponse(string id, ComputeData.Operation response,
                                        string operationType) {
      if (response.Status == "DONE") {
        if (response.Error != null) {
          string errorMessage = Utils.FormatErrors(response.Error.Errors);
          _logger.LogCritical(
              $"Error in {operationType} long-running operation {id}:\n{errorMessage}");
          System.Environment.Exit(10);
        }
        _logger.LogDebug($"Long-running {operationType} operation {id} completed.");
        return true;
      }
      return false;
    }

    // Wait for long running operation to complete.
    public async Task<bool> WaitForOperation(string projectId, string type, string location,
                                             string id) {
      bool ret = false;
      switch (type) {
        case GLOBAL:
          _logger.LogDebug($"Waiting for long-running global operation {id} to complete...");
          do {
            GlobalOperationsResource.GetRequest request =
                computeService.GlobalOperations.Get(projectId, id);
            ComputeData.Operation response = request.Execute();
            if (HandleOperationResponse(id, response, "global")) {
              ret = true;
              break;
            }
            System.Threading.Thread.Sleep(600);
          } while (true);
          break;
        case REGION:
          _logger.LogDebug($"Waiting for long-running regional operation {id} to complete...");
          do {
            RegionOperationsResource.GetRequest request =
                computeService.RegionOperations.Get(projectId, location, id);
            ComputeData.Operation response = request.Execute();
            if (HandleOperationResponse(id, response, "regional")) {
              ret = true;
              break;
            }
            System.Threading.Thread.Sleep(600);
          } while (true);
          break;
        case ZONE:
          _logger.LogDebug($"Waiting for long-running zonal operation {id} to complete...");
          do {
            ZoneOperationsResource.GetRequest request =
                computeService.ZoneOperations.Get(projectId, location, id);
            ComputeData.Operation response = request.Execute();
            if (HandleOperationResponse(id, response, "zonal")) {
              ret = true;
              break;
            }
            System.Threading.Thread.Sleep(600);
          } while (true);
          break;
      }
      return ret;
    }
    public async Task<string> WaitOrFailForOperation(string projectId, string type, string location,
                                                     string id) {
      string ret = "NOT_GOOD";
      if (type == "global") {
        _logger.LogDebug($"Waiting for long-running global operation {id} to complete...");
        do {
          GlobalOperationsResource.GetRequest request =
              computeService.GlobalOperations.Get(projectId, id);
          ComputeData.Operation response = request.Execute();
          if (response.Status == "DONE") {
            if (response.Error != null) {
              foreach (var error in response.Error.Errors) {
                return error.Code;
              }
            }
            _logger.LogDebug($"Long-running global operation {id} completed.");
            ret = "";
            break;
          }
          System.Threading.Thread.Sleep(600);
        } while (true);
      }
      if (type == "region") {
        _logger.LogDebug($"Waiting for long-running regional operation {id} to complete...");
        do {
          RegionOperationsResource.GetRequest request =
              computeService.RegionOperations.Get(projectId, location, id);
          ComputeData.Operation response = request.Execute();
          if (response.Status == "DONE") {
            if (response.Error != null) {
              foreach (var error in response.Error.Errors) {
                return error.Code;
              }
            }
            _logger.LogDebug($"Long-running regional operation {id} completed.");
            ret = "";
            break;
          }
          System.Threading.Thread.Sleep(600);
        } while (true);
      }
      if (type == "zone") {
        _logger.LogDebug($"Waiting for long-running zonal operation {id} to complete...");
        do {
          ZoneOperationsResource.GetRequest request =
              computeService.ZoneOperations.Get(projectId, location, id);
          ComputeData.Operation response = request.Execute();
          if (response.Status == "DONE") {
            if (response.Error != null) {
              foreach (var error in response.Error.Errors) {
                return error.Code;
              }
            }
            _logger.LogDebug($"Long-running zonal operation {id} completed.");
            ret = "";
            break;
          }
          System.Threading.Thread.Sleep(600);
        } while (true);
      }
      return ret;
    }
  }

}