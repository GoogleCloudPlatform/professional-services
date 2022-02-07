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
using System.Net;
using System.Diagnostics;
using System.Threading.Tasks;
using System.Collections.Generic;
using System.Text.RegularExpressions;
using Microsoft.Extensions.Logging;
using Google.Apis.Auth.OAuth2;
using ComputeV1 = Google.Apis.Compute.v1;
using ComputeBeta = Google.Apis.Compute.beta;
using Google.Apis.CloudResourceManager.v1;
using Google.Apis.Services;
using Newtonsoft.Json;
using ByteSizeLib;
using ConsoleUI;

using ComputeData = Google.Apis.Compute.v1.Data;
using ComputeBetaData = Google.Apis.Compute.beta.Data;

#nullable enable
#pragma warning disable CS1998
namespace GSnapshot {
  public class Snapshots {
    private readonly ILogger<Runner> _logger;
    private readonly Utils _utils;
    private readonly Operations _operations;
    private Disks? _disks;

    private ComputeV1.ComputeService computeService =
        new ComputeV1.ComputeService(new BaseClientService.Initializer {
          HttpClientInitializer = Utils.GetCredential(),
          ApplicationName = Utils.ApplicationName,
        });

    private ComputeBeta.ComputeService betaComputeService =
        new ComputeBeta.ComputeService(new BaseClientService.Initializer {
          HttpClientInitializer = Utils.GetCredential(),
          ApplicationName = Utils.ApplicationName,
        });

    public Snapshots(ILogger<Runner> logger, Utils utils, Operations operations) {
      _logger = logger;
      _utils = utils;
      _operations = operations;
    }

    public void SetDisks(Disks disks) {
      _disks = disks;
    }

    public async Task<ComputeData.ResourcePolicy?> GetSnapshotSchedule(string projectId,
                                                                       string schedule,
                                                                       string region) {
      ComputeV1.ResourcePoliciesResource.GetRequest request =
          computeService.ResourcePolicies.Get(projectId, region, schedule);
      try {
        ComputeData.ResourcePolicy response = await request.ExecuteAsync();
        return response;
      } catch (Google.GoogleApiException e) {
        if (e.HttpStatusCode != HttpStatusCode.NotFound) {
          throw;
        }
      }
      return null;
    }

    // Adds a  snapshot schedules for all disks of an instance
    public async Task<bool> AddInstanceSnapshotSchedule(string projectId, string schedule,
                                                        string region,
                                                        ComputeData.Instance instance) {
      if (_disks == null) {
        _logger.LogCritical("Internal error, disks is null.");
        return false;
      }
      List<Task<bool>> tasks = new List<Task<bool>>();
      foreach (var disk in instance.Disks) {
        ComputeData.Disk diskInfo = await _disks.GetDiskFromAttachedDiskAsync(projectId, disk);
        if (diskInfo.ResourcePolicies == null || !diskInfo.ResourcePolicies.Contains(schedule)) {
          tasks.Add(Task.Run(async () => {
            bool done = false;
            string diskLocation = _utils.GetLastPartN(disk.Source, 4);
            List<string> resourcePolicies = new List<string>();
            resourcePolicies.Add(schedule);
            if (diskLocation == "regions") {
              ComputeData.RegionDisksAddResourcePoliciesRequest requestBody =
                  new ComputeData.RegionDisksAddResourcePoliciesRequest();
              requestBody.ResourcePolicies = resourcePolicies;
              ComputeV1.RegionDisksResource.AddResourcePoliciesRequest request =
                  computeService.RegionDisks.AddResourcePolicies(requestBody, projectId, region,
                                                                 diskInfo.Name);
              ComputeData.Operation response = await request.ExecuteAsync();
              done = await _operations.WaitForOperation(projectId, Operations.REGION, region,
                                                        _utils.GetLastPart(response.SelfLink));
            } else {
              ComputeData.DisksAddResourcePoliciesRequest requestBody =
                  new ComputeData.DisksAddResourcePoliciesRequest();
              requestBody.ResourcePolicies = resourcePolicies;
              ComputeV1.DisksResource.AddResourcePoliciesRequest request =
                  computeService.Disks.AddResourcePolicies(
                      requestBody, projectId, _utils.GetLastPart(instance.Zone), diskInfo.Name);
              ComputeData.Operation response = await request.ExecuteAsync();
              done = await _operations.WaitForOperation(projectId, Operations.ZONE,
                                                        _utils.GetLastPart(instance.Zone),
                                                        _utils.GetLastPart(response.SelfLink));
            }
            return done;
          }));
        }
      }
      Task.WaitAll(tasks.ToArray());
      foreach (var taskDone in tasks) {
        if (!taskDone.Result) {
          return false;
        }
      }
      return true;
    }

    // Clears snapshot schedules for all disks of an instance
    public async Task<bool> ClearInstanceSnapshotSchedule(string projectId, string schedule,
                                                          string region,
                                                          ComputeData.Instance instance) {
      if (_disks == null) {
        _logger.LogCritical("Internal error, disks is null.");
        return false;
      }
      List<Task<bool>> tasks = new List<Task<bool>>();
      foreach (var disk in instance.Disks) {
        ComputeData.Disk diskInfo = await _disks.GetDiskFromAttachedDiskAsync(projectId, disk);
        if (diskInfo.ResourcePolicies != null) {
          tasks.Add(Task.Run(async () => {
            bool done = false;
            string diskLocation = _utils.GetLastPartN(disk.Source, 4);
            if (diskLocation == "regions") {
              ComputeData.RegionDisksRemoveResourcePoliciesRequest requestBody =
                  new ComputeData.RegionDisksRemoveResourcePoliciesRequest();
              requestBody.ResourcePolicies = diskInfo.ResourcePolicies;
              ComputeV1.RegionDisksResource.RemoveResourcePoliciesRequest request =
                  computeService.RegionDisks.RemoveResourcePolicies(requestBody, projectId, region,
                                                                    diskInfo.Name);
              ComputeData.Operation response = await request.ExecuteAsync();
              done = await _operations.WaitForOperation(projectId, Operations.REGION, region,
                                                        _utils.GetLastPart(response.SelfLink));
            } else {
              ComputeData.DisksRemoveResourcePoliciesRequest requestBody =
                  new ComputeData.DisksRemoveResourcePoliciesRequest();
              requestBody.ResourcePolicies = diskInfo.ResourcePolicies;
              ComputeV1.DisksResource.RemoveResourcePoliciesRequest request =
                  computeService.Disks.RemoveResourcePolicies(
                      requestBody, projectId, _utils.GetLastPart(instance.Zone), diskInfo.Name);
              ComputeData.Operation response = await request.ExecuteAsync();
              done = await _operations.WaitForOperation(projectId, Operations.ZONE,
                                                        _utils.GetLastPart(instance.Zone),
                                                        _utils.GetLastPart(response.SelfLink));
            }
            return done;
          }));
        }
      }
      Task.WaitAll(tasks.ToArray());
      foreach (var taskDone in tasks) {
        if (!taskDone.Result) {
          return false;
        }
      }
      return true;
    }

    // Snapshots a Compute Engine instance's disks
    public async Task<Dictionary<string, Tuple<ComputeData.Disk, ComputeData.Snapshot>>>
    SnapshotInstanceDisksAsync(string projectId, ComputeData.Instance instance, string location,
                               int id, bool force) {
      _logger.LogInformation($"Starting to snapshot disks on {instance.Name}...");
      Dictionary<string, Tuple<ComputeData.Disk, ComputeData.Snapshot>> results =
          new Dictionary<string, Tuple<ComputeData.Disk, ComputeData.Snapshot>>();
      List<Task<Tuple<string, Tuple<ComputeData.Disk, ComputeData.Snapshot>>>> tasks =
          new List<Task<Tuple<string, Tuple<ComputeData.Disk, ComputeData.Snapshot>>>>();

      if (_disks == null) {
        _logger.LogCritical("Internal error, disks is null.");
        return results;
      }

      bool findNextSnapshot = (id == 0);
      if (id == 0) {
        id = 1;
      }
      int maxId = 0;
      var allSnapshots = await GetAllSnapshotsAsync(projectId, instance);

      Dictionary<ComputeData.AttachedDisk, ComputeData.Disk> disks =
          new Dictionary<ComputeData.AttachedDisk, ComputeData.Disk>();
      Dictionary<int, Tuple<int, string, string>> existingSnapshots =
          new Dictionary<int, Tuple<int, string, string>>();
      foreach (var disk in instance.Disks) {
        ComputeData.Disk diskInfo = await _disks.GetDiskFromAttachedDiskAsync(projectId, disk);
        disks[disk] = diskInfo;
        string diskName = diskInfo.Name;
        string diskType = _utils.GetLastPart(diskInfo.Type);

        Regex snapshotRx = new Regex(
            $"^gsnapshot-(?<id>[0-9]+?)-{Regex.Escape(diskType)}-{Regex.Escape(diskName)}",
            RegexOptions.Compiled);
        // Look for snapshots in the format "gsnapshot-<id>-<disktype>-<diskname>
        foreach (KeyValuePair<string, ComputeData.Snapshot> entry in allSnapshots) {
          MatchCollection nameMatches = snapshotRx.Matches(entry.Key);
          if (nameMatches.Count > 0) {
            foreach (Match match in nameMatches) {
              string _id = match.Groups["id"].Value;
              int sid = Int32.Parse(_id);
              if (sid > maxId) {
                maxId = sid;
              }
              if (existingSnapshots.ContainsKey(sid)) {
                existingSnapshots[sid] = new Tuple<int, string, string>(
                    existingSnapshots[sid].Item1 + 1, existingSnapshots[sid].Item2,
                    existingSnapshots[sid].Item3);
              } else {
                existingSnapshots[sid] = new Tuple<int, string, string>(
                    1, DateTimeOffset.Parse(entry.Value.CreationTimestamp).ToLocalTime().ToString(),
                    entry.Value.Description);
              }
            }
          }
        }
      }
      if (findNextSnapshot) {
        if (existingSnapshots.Keys.Count == 0) {
          _logger.LogInformation("No existing snapshots found.");
        }
        foreach (KeyValuePair<int, Tuple<int, string, string>> entry in existingSnapshots) {
          _logger.LogInformation($"Found snapshot ID: {entry.Key}");
          _logger.LogInformation(
              $"  Disks in snapshot: {entry.Value.Item1}/{instance.Disks.Count}  Created: {entry.Value.Item2}");
          _logger.LogInformation($"  Description: {entry.Value.Item3}");
        }
        id = maxId + 1;
      } else {
        if (existingSnapshots.ContainsKey(id)) {
          _logger.LogCritical(
              $"Not creating a new snapshot, since snapshot ID #{id} already exists.");
          System.Environment.Exit(11);
        }
      }

      if (findNextSnapshot) {
        if (!force) {
          if (_utils.GetYesNo($"Create a new snapshot with ID #{id} (Y/n)?", true)) {
            _logger.LogInformation($"Using snapshot ID #{id}.");
          } else {
            _logger.LogWarning("Not creating a new snapshot, since one already exists.");
            System.Environment.Exit(11);
          }
        } else {
          _logger.LogInformation($"Using snapshot ID #{id}.");
        }
      }

      foreach (var disk in instance.Disks) {
        ComputeData.Disk diskInfo = disks[disk];
        tasks.Add(Task.Run(async () => {
          string zone = _utils.GetLastPartN(disk.Source, 3);
          string diskType = _utils.GetLastPart(diskInfo.Type);
          string diskLocation = _utils.GetLastPartN(disk.Source, 4);
          string diskName = diskInfo.Name;
          string snapshotName = $"gsnapshot-{id}-{diskType}-{diskName}";

          ComputeData.Snapshot snapShot;
          if (diskLocation == "regions") {
            snapShot = await CreateRegionalSnapshotAsync(projectId, zone, instance, diskInfo,
                                                         snapshotName, location, id, allSnapshots);
          } else {
            snapShot = await CreateSnapshotAsync(projectId, zone, instance, diskInfo, snapshotName,
                                                 location, id, allSnapshots);
          }
          bool done = await WaitForSnapshotAsync(projectId, snapShot.Name);
          return new Tuple<string, Tuple<ComputeData.Disk, ComputeData.Snapshot>>(
              diskInfo.Name, new Tuple<ComputeData.Disk, ComputeData.Snapshot>(diskInfo, snapShot));
        }));
      }
      Task.WaitAll(tasks.ToArray());
      foreach (var task in tasks) {
        Tuple<string, Tuple<ComputeData.Disk, ComputeData.Snapshot>> result = task.Result;

        results[result.Item1] = result.Item2;
      }
      return results;
    }

    // Gets a single snapshot object from API
    public async Task<ComputeData.Snapshot> GetSnapshotAsync(string projectId, string snapshot) {
      _logger.LogDebug($"Fetching snapshot {snapshot} in project {projectId}");
      ComputeV1.SnapshotsResource.GetRequest request =
          computeService.Snapshots.Get(projectId, snapshot);
      ComputeData.Snapshot response = await request.ExecuteAsync();
      return response;
    }

    // Gets all snapshots from a project
    public async Task<Dictionary<string, ComputeData.Snapshot>> GetAllSnapshotsAsync(
        string projectId, ComputeData.Instance instance, bool onlyManuallyCreated = false,
        bool onlyAutoCreated = false) {
      _logger.LogDebug($"Fetching all snapshots in project {projectId}");
      ComputeV1.SnapshotsResource.ListRequest request = computeService.Snapshots.List(projectId);
      if (onlyAutoCreated) {
        request.Filter = "autoCreated=true";
      }
      if (onlyManuallyCreated) {
        request.Filter = "autoCreated=false";
      }
      ComputeData.SnapshotList response;
      Dictionary<string, ComputeData.Snapshot> results =
          new Dictionary<string, ComputeData.Snapshot>();
      do {
        response = request.Execute();
        if (response.Items == null) {
          continue;
        }
        foreach (ComputeData.Snapshot snapshot in response.Items) {
          results[snapshot.Name] = snapshot;
        }
        request.PageToken = response.NextPageToken;
      } while (response.NextPageToken != null);
      return results;
    }

    // Waits for a snapshot to be in READY state
    public async Task<bool> WaitForSnapshotAsync(string projectId, string snapshot) {
      bool ret = false;
      _logger.LogInformation($"Waiting for snapshot {snapshot} to be ready...");
      do {
        ComputeData.Snapshot snapshotInfo = await GetSnapshotAsync(projectId, snapshot);
        if (snapshotInfo.Status == "READY") {
          ret = true;
          break;
        }
        System.Threading.Thread.Sleep(750);
      } while (true);
      return ret;
    }

    // Creates a "gsnapshot" style snapshot from an instance's zonal disk
    public async Task<ComputeData.Snapshot> CreateSnapshotAsync(
        string projectId, string zone, ComputeData.Instance instance, ComputeData.Disk disk,
        string snapshotName, string location, int id,
        Dictionary<string, ComputeData.Snapshot> allSnapshots) {
      ComputeBetaData.Snapshot requestBody = new ComputeBetaData.Snapshot();
      ComputeBetaData.Operation response;
      string diskName = disk.Name;
      string diskType = _utils.GetLastPart(disk.Type);
      string dateNow = DateTime.UtcNow.ToString();

      if (allSnapshots.ContainsKey(snapshotName)) {
        _logger.LogWarning($"Snapshot name {snapshotName} already exists, skipping...");
        return allSnapshots[snapshotName];
      }

      requestBody.Name = snapshotName;
      requestBody.Description =
          $"GSnapshot #{id} for {instance.Name}:{diskType}/{zone} - {dateNow} UTC";
      requestBody.SourceDisk = diskName;
      requestBody.GuestFlush = true;
      if (location.ToUpper() == "EU" || location.ToUpper() == "US" ||
          location.ToUpper() == "ASIA") {
        _logger.LogInformation(
            $"Creating snapshot \"{snapshotName}\" of {diskName} in multi-regional storage location {location.ToUpper()}...");
        requestBody.StorageLocations = new List<string> { location.ToUpper() };
      } else {
        string region = zone.Substring(0, zone.Length - 2);
        if (location.ToLower() == "match") {
          _logger.LogInformation(
              $"Creating snapshot \"{snapshotName}\" of {diskName} in regional storage location {region}...");
          requestBody.StorageLocations = new List<string> { region };
        } else {
          _logger.LogInformation(
              $"Creating snapshot \"{snapshotName}\" of {diskName} in regional storage location {location}...");
          requestBody.StorageLocations = new List<string> { location };
        }
      }

      ComputeBeta.DisksResource.CreateSnapshotRequest request =
          betaComputeService.Disks.CreateSnapshot(requestBody, projectId, zone, diskName);
      response = await request.ExecuteAsync();
      bool done = await _operations.WaitForOperation(projectId, Operations.ZONE, zone,
                                                     _utils.GetLastPart(response.SelfLink));
      return await GetSnapshotAsync(projectId, snapshotName);
    }

    // Creates a "gsnapshot" style snapshot from an instance's regionally replicated disk
    public async Task<ComputeData.Snapshot> CreateRegionalSnapshotAsync(
        string projectId, string region, ComputeData.Instance instance, ComputeData.Disk disk,
        string snapshotName, string location, int id,
        Dictionary<string, ComputeData.Snapshot> allSnapshots) {
      ComputeBetaData.Snapshot requestBody = new ComputeBetaData.Snapshot();
      ComputeBetaData.Operation response;
      string diskName = disk.Name;
      string diskType = _utils.GetLastPart(disk.Type);
      string dateNow = DateTime.UtcNow.ToString();

      if (allSnapshots.ContainsKey(snapshotName)) {
        _logger.LogWarning($"Snapshot name {snapshotName} already exists, skipping...");
        return allSnapshots[snapshotName];
      }

      requestBody.Name = snapshotName;
      requestBody.Description =
          $"GSnapshot #{id} for {instance.Name}:{diskType}/{region} - {dateNow} UTC";
      requestBody.SourceDisk = diskName;
      requestBody.GuestFlush = true;
      if (location.ToUpper() == "EU" || location.ToUpper() == "US" ||
          location.ToUpper() == "ASIA") {
        _logger.LogInformation(
            $"Creating snapshot \"{snapshotName}\" of {diskName} in multi-regional storage location {location.ToUpper()}...");
        requestBody.StorageLocations = new List<string> { location.ToUpper() };
      } else {
        if (location.ToLower() == "match") {
          _logger.LogInformation(
              $"Creating snapshot \"{snapshotName}\" of {diskName} in regional storage location {region}...");
          requestBody.StorageLocations = new List<string> { region };
        } else {
          _logger.LogInformation(
              $"Creating snapshot \"{snapshotName}\" of {diskName} in regional storage location {location}...");
          requestBody.StorageLocations = new List<string> { location };
        }
      }

      ComputeBeta.RegionDisksResource.CreateSnapshotRequest request =
          betaComputeService.RegionDisks.CreateSnapshot(requestBody, projectId, region, diskName);
      response = await request.ExecuteAsync();
      bool done = await _operations.WaitForOperation(projectId, Operations.REGION, region,
                                                     _utils.GetLastPart(response.SelfLink));
      return await GetSnapshotAsync(projectId, snapshotName);
    }

    // Gets all gsnapshot-style snapshots for an instance
    public async Task<Dictionary<string, Tuple<ComputeData.Disk, ComputeData.Snapshot?>>>
    GetSnapshotsForInstance(string projectId, ComputeData.Instance instance, int id,
                            bool forcePrevious) {
      var allSnapshots = await GetAllSnapshotsAsync(projectId, instance, true, false);
      Regex rx = new Regex(@"-[0-9]{8}-[0-9]{4}$", RegexOptions.Compiled);

      _logger.LogInformation("Looking for manual rollback snapshots...");
      Dictionary<int, Dictionary<string, Tuple<ComputeData.Disk, ComputeData.Snapshot?>>> disks =
          new Dictionary<int, Dictionary<string, Tuple<ComputeData.Disk, ComputeData.Snapshot?>>>();
      Dictionary<string, Tuple<ComputeData.Disk, ComputeData.Snapshot?>> emptyResult =
          new Dictionary<string, Tuple<ComputeData.Disk, ComputeData.Snapshot?>>();
      if (_disks == null) {
        _logger.LogCritical("Internal error, disks is null.");
        return emptyResult;
      }

      foreach (ComputeData.AttachedDisk disk in instance.Disks) {
        // Get the attached disk resource
        ComputeData.Disk diskInfo = await _disks.GetDiskFromAttachedDiskAsync(projectId, disk);
        string diskName = diskInfo.Name;
        string diskType = _utils.GetLastPart(diskInfo.Type);

        MatchCollection matches = rx.Matches(diskName);
        if (matches.Count > 0) {
          diskName = diskName.Substring(0, diskName.Length - 14);
        }

        Regex snapshotRx = new Regex(
            $"^gsnapshot-(?<id>[0-9]+?)-{Regex.Escape(diskType)}-{Regex.Escape(diskName)}",
            RegexOptions.Compiled);
        // Look for snapshots in the format "gsnapshot-<id>-<disktype>-<diskname>
        foreach (KeyValuePair<string, ComputeData.Snapshot> entry in allSnapshots) {
          MatchCollection nameMatches = snapshotRx.Matches(entry.Key);
          if (nameMatches.Count > 0) {
            foreach (Match match in nameMatches) {
              string _id = match.Groups["id"].Value;
              int sid = Int32.Parse(_id);
              if (!disks.ContainsKey(sid)) {
                disks[sid] =
                    new Dictionary<string, Tuple<ComputeData.Disk, ComputeData.Snapshot?>>();
              }
              _logger.LogInformation(
                  $"Found snapshot #{sid} for {diskName}: {entry.Key} ({entry.Value.Description})");
              disks[sid][disk.Source] =
                  new Tuple<ComputeData.Disk, ComputeData.Snapshot?>(diskInfo, entry.Value);
            }
          }
        }
      }
      if (id == 0) {
        Dictionary<int, string> menuOptions = new Dictionary<int, string>();
        foreach (KeyValuePair<int,
                              Dictionary<string, Tuple<ComputeData.Disk, ComputeData.Snapshot?>>>
                     entry in disks) {
          int numOfDisks = 0, numOfSnapshots = 0;
          string snapshotTime = "???";
          foreach (KeyValuePair<string, Tuple<ComputeData.Disk, ComputeData.Snapshot?>> disk in
                       entry.Value) {
            numOfDisks += 1;
            if (disk.Value.Item2 != null) {
              snapshotTime =
                  DateTimeOffset.Parse(disk.Value.Item2.CreationTimestamp).ToLocalTime().ToString();
              numOfSnapshots += 1;
            }
          }
          string snapshot =
              $"Snapshot #{entry.Key} taken at {snapshotTime} ({numOfSnapshots}/{numOfDisks} disks in snapshot)";
          menuOptions[entry.Key] = snapshot;
        }
        if (menuOptions.Keys.Count == 0) {
          _logger.LogCritical("No snapshots found for the instance.");
          System.Environment.Exit(12);
        }
        Menu menu = new Menu("Select snapshot to roll back to:", menuOptions);
        int? _id = menu.Show();
        if (_id == null) {
          _logger.LogWarning("Rollback aborted.");
          System.Environment.Exit(0);
        }
        return disks[(int)_id];
      } else {
        if (!disks.ContainsKey(id)) {
          _logger.LogCritical($"No snapshot ID #{id} found, failing.");
          System.Environment.Exit(12);
        }
        return disks[id];
      }
    }

    // Gets all scheduled snapshots for an instance
    public async
        Task<Dictionary<string, Dictionary<string, Tuple<ComputeData.Disk, ComputeData.Snapshot?>>>>
        GetScheduledSnapshotsForInstance(string projectId, ComputeData.Instance instance) {
      var allSnapshots = await GetAllSnapshotsAsync(projectId, instance, false, true);
      Regex rx = new Regex(@"-[0-9]{8}-[0-9]{4}$", RegexOptions.Compiled);

      _logger.LogInformation("Looking for scheduled rollback snapshots...");

      Dictionary<string, Dictionary<string, Tuple<ComputeData.Disk, ComputeData.Snapshot?>>>
          snapshots =
              new Dictionary<string,
                             Dictionary<string, Tuple<ComputeData.Disk, ComputeData.Snapshot?>>>();

      if (_disks == null) {
        _logger.LogCritical("Internal error, disks is null.");
        return snapshots;
      }

      Dictionary<ComputeData.AttachedDisk, ComputeData.Disk> allDisks =
          new Dictionary<ComputeData.AttachedDisk, ComputeData.Disk>();
      foreach (ComputeData.AttachedDisk disk in instance.Disks) {
        // Get the attached disk resource
        ComputeData.Disk diskInfo = await _disks.GetDiskFromAttachedDiskAsync(projectId, disk);
        allDisks[disk] = diskInfo;

        string diskName = diskInfo.Name;
        string diskType = _utils.GetLastPart(diskInfo.Type);
        string diskLocation = _utils.GetLastPartN(diskInfo.SelfLink, 3);
        if (diskName.Length > 19)  // Too long disk names get cropped
        {
          diskName = diskName.Substring(0, 19);
        }
        string snapshotName = $"{diskName}-{diskLocation}-";

        foreach (KeyValuePair<string, ComputeData.Snapshot> entry in allSnapshots) {
          if (entry.Key.StartsWith(snapshotName)) {
            _logger.LogDebug($"Found snapshot {entry.Key} for {diskName} ({diskLocation}).");
            string snapshotId = entry.Key.Substring(snapshotName.Length,
                                                    entry.Key.Length - snapshotName.Length - 9);
            if (!snapshots.ContainsKey(snapshotId)) {
              snapshots[snapshotId] =
                  new Dictionary<string, Tuple<ComputeData.Disk, ComputeData.Snapshot?>>();
            }
            if (!snapshots[snapshotId].ContainsKey(disk.Source)) {
              snapshots[snapshotId][disk.Source] =
                  new Tuple<ComputeData.Disk, ComputeData.Snapshot?>(diskInfo, entry.Value);
            } else {
              _logger.LogCritical(
                  $"We found two snapshots for the same disk (disk {diskName}), ignoring snapshot {entry.Key}!");
            }
          }
        }
      }
      // Fill out missing snapshots
      foreach (KeyValuePair<string,
                            Dictionary<string, Tuple<ComputeData.Disk, ComputeData.Snapshot?>>>
                   entry in snapshots) {
        foreach (KeyValuePair<ComputeData.AttachedDisk, ComputeData.Disk> disk in allDisks) {
          if (!entry.Value.ContainsKey(disk.Key.Source)) {
            snapshots[entry.Key][disk.Key.Source] =
                new Tuple<ComputeData.Disk, ComputeData.Snapshot?>(disk.Value, null);
          }
        }
      }
      return snapshots;
    }

    // Deletes a snapshot
    public async Task<bool> DeleteSnapshotAsync(string projectId, ComputeData.Snapshot snapshot) {
      _logger.LogInformation($"Deleting snapshot {snapshot.Name}...");
      ComputeV1.SnapshotsResource.DeleteRequest request =
          computeService.Snapshots.Delete(projectId, snapshot.Name);
      ComputeData.Operation response = request.Execute();
      bool done = await _operations.WaitForOperation(projectId, Operations.GLOBAL, "",
                                                     _utils.GetLastPart(response.SelfLink));
      return done;
    }

    // Deletes all disk snapshots from a gsnapshot-style snapshot
    public async Task<bool> DeleteSnapshotsAsync(string projectId, ComputeData.Instance instance,
                                                 int id, bool forceDelete) {
      bool allOk = true;
      var allSnapshots = await GetAllSnapshotsAsync(projectId, instance, true, false);
      List<string> snapshotsToDelete = new List<string>();

      if (_disks == null) {
        _logger.LogCritical("Internal error, disks is null.");
        return false;
      }

      foreach (ComputeData.AttachedDisk disk in instance.Disks) {
        string diskName = _utils.GetLastPart(disk.Source);
        string zone = _utils.GetLastPartN(disk.Source, 3);
        var actualDisk = await _disks.GetDiskFromAttachedDiskAsync(projectId, disk);
        string diskType = _utils.GetLastPart(actualDisk.Type);

        string snapshotName = $"gsnapshot-{id}-{diskType}-{diskName}";
        _logger.LogDebug($"Looking for snapshot {snapshotName} for {diskName}...");
        if (allSnapshots.ContainsKey(snapshotName)) {
          _logger.LogInformation($"Found snapshot {snapshotName} for disk {diskName}.");
          snapshotsToDelete.Add(snapshotName);
        } else {
          _logger.LogWarning($"No snapshot named {snapshotName} found for disk {diskName}.");
        }
      }
      if (snapshotsToDelete.Count > 0) {
        string snapshots = String.Join(", ", snapshotsToDelete);
        _logger.LogWarning($"Snapshots to delete: {snapshots}");
        bool delete = forceDelete;
        if (!delete) {
          delete = _utils.GetYesNo("Delete the snapshots (Y/n)?", true);
        }

        List<Task<bool>> tasks = new List<Task<bool>>();
        foreach (string snapshot in snapshotsToDelete) {
          tasks.Add(Task.Run(async () => {
            return await DeleteSnapshotAsync(projectId, allSnapshots[snapshot]);
          }));
        }
        var results = await Task.WhenAll(tasks);
        allOk = true;
        foreach (bool res in results) {
          if (!res) {
            allOk = false;
          }
        }
        return allOk;
      } else {
        _logger.LogCritical("No snapshots to delete found!");
      }
      return true;
    }
  }
}