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
  public class Resources {
    private readonly ILogger<Runner> _logger;
    private readonly Utils _utils;

    private ComputeService computeService = new ComputeService(new BaseClientService.Initializer {
      HttpClientInitializer = Utils.GetCredential(),
      ApplicationName = Utils.ApplicationName,
    });
    private CloudResourceManagerService cloudResourceManagerService =
        new CloudResourceManagerService(new BaseClientService.Initializer {
          HttpClientInitializer = Utils.GetCredential(),
          ApplicationName = Utils.ApplicationName,
        });

    public Dictionary<string, string> AllRegions = new Dictionary<string, string>();
    public Dictionary<string, List<string>> AllZones = new Dictionary<string, List<string>>();

    public Resources(ILogger<Runner> logger, Utils utils) {
      _logger = logger;
      _utils = utils;
    }

    public Dictionary<string, string> GetAllProjects() {
      Google.Apis.CloudResourceManager.v1.ProjectsResource.ListRequest request =
          cloudResourceManagerService.Projects.List();
      CrmData.ListProjectsResponse response;
      Dictionary<string, string> Projects = new Dictionary<string, string>();
      do {
        response = request.Execute();
        if (response.Projects == null) {
          continue;
        }
        foreach (CrmData.Project project in response.Projects) {
          string label = $"{project.ProjectId} ({project.Name}, {project.ProjectNumber})";
          Projects[label] = project.ProjectId;
        }
        request.PageToken = response.NextPageToken;
      } while (response.NextPageToken != null);
      _logger.LogInformation($"{Projects.Count} projects loaded.");

      return Projects;
    }

    // Load all zones into a property
    public void LoadAllZones(string projectId) {
      ZonesResource.ListRequest request = computeService.Zones.List(projectId);
      ComputeData.ZoneList response;
      do {
        response = request.Execute();
        if (response.Items == null) {
          continue;
        }
        foreach (ComputeData.Zone zone in response.Items) {
          string region = _utils.GetLastPart(zone.Region);
          if (!AllZones.ContainsKey(region)) {
            AllZones[region] = new List<string>();
          }
          AllZones[region].Add(zone.Name);
        }
        request.PageToken = response.NextPageToken;
      } while (response.NextPageToken != null);
    }

    // Load all regions into a property
    public void LoadAllRegions(string projectId) {
      RegionsResource.ListRequest request = computeService.Regions.List(projectId);

      ComputeData.RegionList response;
      do {
        response = request.Execute();
        if (response.Items == null) {
          continue;
        }
        foreach (ComputeData.Region region in response.Items) {
          AllRegions[region.Name] = region.Name;
        }
        request.PageToken = response.NextPageToken;
      } while (response.NextPageToken != null);
    }
  }
}