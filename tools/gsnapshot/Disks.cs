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
using ComputeV1 = Google.Apis.Compute.v1;
using ComputeBeta = Google.Apis.Compute.beta;
using Google.Apis.CloudResourceManager.v1;
using Google.Apis.Services;
using Newtonsoft.Json;
using ByteSizeLib;

using ComputeData = Google.Apis.Compute.v1.Data;
using ComputeBetaData = Google.Apis.Compute.beta.Data;

#nullable enable
#pragma warning disable CS1998
namespace GSnapshot {
  public class Disks {
    private readonly ILogger<Runner> _logger;
    private readonly Snapshots _snapshots;
    private readonly Utils _utils;
    private readonly Operations _operations;

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

    public Dictionary<string, ComputeData.Instance> AllInstances =
        new Dictionary<string, ComputeData.Instance>();

    public Disks(ILogger<Runner> logger, Utils utils, Operations operations, Snapshots snapshots) {
      _logger = logger;
      _utils = utils;
      _operations = operations;
      _snapshots = snapshots;
    }

    // Retrieves a persistent zonal disk object from the API
    public async Task<ComputeData.Disk> GetDiskAsync(string projectId, string zone, string disk) {
      _logger.LogDebug($"Getting persistent disk information: {disk}");
      ComputeV1.DisksResource.GetRequest request = computeService.Disks.Get(projectId, zone, disk);
      ComputeData.Disk response = await request.ExecuteAsync();
      return response;
    }

    // Retrieves a persistent regional disk object from the API
    public async Task<ComputeData.Disk> GetRegionalDiskAsync(string projectId, string zone,
                                                             string disk) {
      _logger.LogDebug($"Getting regional persistent disk information: {disk}");
      ComputeV1.RegionDisksResource.GetRequest request =
          computeService.RegionDisks.Get(projectId, zone, disk);
      ComputeData.Disk response = await request.ExecuteAsync();
      return response;
    }

    // Fetches the disk object based on an AttachedDisk object
    public async Task<ComputeData.Disk> GetDiskFromAttachedDiskAsync(
        string projectId, ComputeData.AttachedDisk disk) {
      string diskName = _utils.GetLastPart(disk.Source);
      string zone = _utils.GetLastPartN(disk.Source, 3);
      string diskType = _utils.GetLastPartN(disk.Source, 4);

      ComputeData.Disk diskInfo;
      if (diskType == "regions") {
        diskInfo = await GetRegionalDiskAsync(projectId, zone, diskName);
      } else {
        diskInfo = await GetDiskAsync(projectId, zone, diskName);
      }
      return diskInfo;
    }

    // Creates a new disk from a snapshot

    public async Task<ComputeData.Disk?> _CreateDiskFromSnapshotAsync(
        string projectId, string diskName, ComputeData.Disk originalDisk,
        ComputeData.Snapshot snapshot, string snapshotDiskType, bool eraseVss) {
      ComputeBetaData.Disk requestBody = new ComputeBetaData.Disk();

      string diskType = _utils.GetLastPartN(originalDisk.Type, 4);
      bool regional = (diskType == "regions" ? true : false);

      requestBody.Name = diskName;
      requestBody.SourceSnapshot = snapshot.SelfLink;
      requestBody.Description = originalDisk.Description;
      requestBody.SizeGb = snapshot.DiskSizeGb;
      // Attempting to restore a 0 length snapshot means it can't have VSS signature
      requestBody.EraseWindowsVssSignature = eraseVss;
      if (!regional) {
        requestBody.Type =
            $"projects/{projectId}/zones/{_utils.GetLastPart(originalDisk.Zone)}/diskTypes/{snapshotDiskType}";
      } else {
        requestBody.Type =
            $"projects/{projectId}/regions/{_utils.GetLastPart(originalDisk.Region)}/diskTypes/{snapshotDiskType}";
        requestBody.ReplicaZones = originalDisk.ReplicaZones;
      }
      if (originalDisk.GuestOsFeatures != null) {
        requestBody.GuestOsFeatures = new List<ComputeBetaData.GuestOsFeature>();
        foreach (ComputeData.GuestOsFeature feature in originalDisk.GuestOsFeatures) {
          ComputeBetaData.GuestOsFeature betaFeature = new ComputeBetaData.GuestOsFeature();
          betaFeature.Type = feature.Type;
          betaFeature.ETag = feature.ETag;
          requestBody.GuestOsFeatures.Add(betaFeature);
        }
      }
      requestBody.Labels = originalDisk.Labels;
      requestBody.ResourcePolicies = originalDisk.ResourcePolicies;
      if (originalDisk.Labels == null) {
        requestBody.Labels = new Dictionary<string, string>();
      } else {
        requestBody.Labels = originalDisk.Labels;
      }
      requestBody.Labels["gsnapshot"] = snapshot.Name;

      if (!regional) {
        string zone = _utils.GetLastPart(originalDisk.Zone);
        _logger.LogInformation(
            $"Creating new zonal disk {diskName} in {zone} from snapshot {snapshot.Name}...");
        ComputeBeta.DisksResource.InsertRequest request =
            betaComputeService.Disks.Insert(requestBody, projectId, zone);
        ComputeBetaData.Operation response = await request.ExecuteAsync();
        bool operationCompleted = false;
        if (!eraseVss) {
          bool done = await _operations.WaitForOperation(projectId, Operations.ZONE, zone,
                                                         _utils.GetLastPart(response.SelfLink));
          if (done) {
            operationCompleted = true;
          }
        } else {
          string done = await _operations.WaitOrFailForOperation(
              projectId, Operations.ZONE, zone, _utils.GetLastPart(response.SelfLink));
          if (done == "INTERNAL_ERROR")  // Disk probably didn't have a VSS signature
          {
            _logger.LogDebug(
                "Disk creation resulted in internal error, will retry with VSS signature erasing turned off...");
            requestBody.EraseWindowsVssSignature = false;
            request = betaComputeService.Disks.Insert(requestBody, projectId, zone);
            response = await request.ExecuteAsync();
            done = await _operations.WaitOrFailForOperation(projectId, Operations.ZONE, zone,
                                                            _utils.GetLastPart(response.SelfLink));
          }
          if (done == "") {
            operationCompleted = true;
          }
        }
        if (operationCompleted) {
          var disk = await GetDiskAsync(projectId, zone, diskName);
          return disk;
        } else {
          _logger.LogCritical(
              $"Failed to create a zonal new disk, operation {response.SelfLink} failed to complete.");
          return null;
        }
      } else {
        string region = _utils.GetLastPart(originalDisk.Region);
        _logger.LogInformation(
            $"Creating new regional disk {diskName} in {region} from snapshot {snapshot.Name}...");
        ComputeBeta.RegionDisksResource.InsertRequest request =
            betaComputeService.RegionDisks.Insert(requestBody, projectId, region);
        ComputeBetaData.Operation response = await request.ExecuteAsync();
        bool operationCompleted = false;

        if (!eraseVss) {
          bool done = await _operations.WaitForOperation(projectId, Operations.REGION, region,
                                                         _utils.GetLastPart(response.SelfLink));
          if (done) {
            operationCompleted = true;
          }
        } else {
          string done = await _operations.WaitOrFailForOperation(
              projectId, Operations.REGION, region, _utils.GetLastPart(response.SelfLink));
          if (done == "INTERNAL_ERROR")  // Disk probably didn't have a VSS signature
          {
            _logger.LogDebug(
                "Disk creation resulted in internal error, will retry with VSS signature erasing turned off...");
            requestBody.EraseWindowsVssSignature = false;
            request = betaComputeService.RegionDisks.Insert(requestBody, projectId, region);
            response = await request.ExecuteAsync();
            done = await _operations.WaitOrFailForOperation(projectId, Operations.REGION, region,
                                                            _utils.GetLastPart(response.SelfLink));
          }
          if (done == "") {
            operationCompleted = true;
          }
        }
        if (operationCompleted) {
          var disk = await GetRegionalDiskAsync(projectId, region, diskName);
          return disk;
        } else {
          _logger.LogCritical(
              $"Failed to create a new regional disk, operation {response.SelfLink} failed to complete.");
          return null;
        }
      }
    }
    public async Task<ComputeData.Disk?> CreateDiskFromSnapshotAsync(string projectId,
                                                                     string diskName,
                                                                     ComputeData.Disk originalDisk,
                                                                     ComputeData.Snapshot snapshot,
                                                                     bool eraseVss) {
      var snapshotParts = snapshot.Name.Split('-');
      var snapshotDiskType = $"{snapshotParts[2]}-{snapshotParts[3]}";

      return await _CreateDiskFromSnapshotAsync(projectId, diskName, originalDisk, snapshot,
                                                snapshotDiskType, eraseVss);
    }

    // Creates all new disks from gsnapshot-style snapshots for an instance
    public async Task<Dictionary<string, ComputeData.Disk?>> CreateRollbackDisksAsync(
        string projectId, ComputeData.Instance instance, int id, bool forcePrevious,
        bool eraseVss) {
      Regex rx = new Regex(@"-[0-9]{8}-[0-9]{4}$", RegexOptions.Compiled);

      var allSnapshots = await _snapshots.GetAllSnapshotsAsync(projectId, instance, true, false);

      _logger.LogInformation("Looking for rollback snapshots...");
      int totalDisks = instance.Disks.Count, foundSnapshots = 0;
      Dictionary<string, Tuple<ComputeData.Disk, ComputeData.Snapshot?>> disks =
          await _snapshots.GetSnapshotsForInstance(projectId, instance, id, forcePrevious);
      foreach (KeyValuePair<string, Tuple<ComputeData.Disk, ComputeData.Snapshot?>> entry in
                   disks) {
        if (entry.Value.Item2 != null) {
          foundSnapshots++;
        }
      }
      if (foundSnapshots == 0) {
        _logger.LogCritical($"Did not find any snapshots for {instance.Name} (snapshot ID {id})!");
        System.Environment.Exit(7);
      }
      if (foundSnapshots == totalDisks) {
        _logger.LogInformation($"Snapshots found for all {totalDisks} disks to rollback.");
      }

      _logger.LogInformation("Starting to create new disks from snapshots...");
      List<Task<Dictionary<string, ComputeData.Disk>>> tasks =
          new List<Task<Dictionary<string, ComputeData.Disk>>>();
      foreach (ComputeData.AttachedDisk attachedDisk in instance.Disks) {
        if (!disks.ContainsKey(attachedDisk.Source)) {
          _logger.LogWarning(
              $"We don't have a snapshot for disk {_utils.GetLastPart(attachedDisk.Source)}, skipping...");
          continue;
        }
        var disk = disks[attachedDisk.Source].Item1;
        var snapshot = disks[attachedDisk.Source].Item2;
        tasks.Add(Task.Run(async () => {
          Dictionary<string, ComputeData.Disk> result = new Dictionary<string, ComputeData.Disk>();
          string diskName = disk.Name;
          string dateNow = DateTime.UtcNow.ToString("yyyyMMdd-HHmm");
          string newDiskName = $"{diskName}-{dateNow}";

          // Check if previous disk has already date appended
          MatchCollection matches = rx.Matches(disk.Name);
          if (matches.Count > 0) {
            diskName = diskName.Substring(0, diskName.Length - 14);
            newDiskName = $"{diskName}-{dateNow}";
          }

          if (snapshot != null) {
            var newDisk =
                await CreateDiskFromSnapshotAsync(projectId, newDiskName, disk, snapshot, eraseVss);
            if (newDisk != null) {
              result[disk.Name] = newDisk;
            } else {
              _logger.LogError($"Creating disk {newDiskName} from snapshot failed!");
            }
          }
          return result;
        }));
      }
      Task.WaitAll(tasks.ToArray());
      Dictionary<string, ComputeData.Disk?> results = new Dictionary<string, ComputeData.Disk?>();
      foreach (var task in tasks) {
        Dictionary<string, ComputeData.Disk> result = task.Result;
        foreach (KeyValuePair<string, ComputeData.Disk> entry in result) {
          results[entry.Key] = entry.Value;
        }
      }
      return results;
    }

    // Creates all new disks from scheduled snapshots for an instance
    public async Task<Dictionary<string, ComputeData.Disk?>> CreateScheduledRollbackDisksAsync(
        string projectId, ComputeData.Instance instance,
        Dictionary<string, Tuple<ComputeData.Disk, ComputeData.Snapshot>> rollbackSnapshots,
        bool eraseVss) {
      Regex rx = new Regex(@"-[0-9]{8}-[0-9]{4}$", RegexOptions.Compiled);

      _logger.LogInformation("Starting to create new disks from snapshots...");
      List<Task<Dictionary<string, ComputeData.Disk>>> tasks =
          new List<Task<Dictionary<string, ComputeData.Disk>>>();
      foreach (ComputeData.AttachedDisk attachedDisk in instance.Disks) {
        var disk = rollbackSnapshots[attachedDisk.Source].Item1;
        var snapshot = rollbackSnapshots[attachedDisk.Source].Item2;
        tasks.Add(Task.Run(async () => {
          Dictionary<string, ComputeData.Disk> result = new Dictionary<string, ComputeData.Disk>();
          string diskName = disk.Name;
          string dateNow = DateTime.UtcNow.ToString("yyyyMMdd-HHmm");
          string newDiskName = $"{diskName}-{dateNow}";

          // Check if previous disk has already date appended
          MatchCollection matches = rx.Matches(disk.Name);
          if (matches.Count > 0) {
            diskName = diskName.Substring(0, diskName.Length - 14);
            newDiskName = $"{diskName}-{dateNow}";
          }

          if (snapshot != null) {
            _logger.LogDebug($"Creating {newDiskName} from scheduled snapshot {snapshot.Name}...");
            var newDisk = await _CreateDiskFromSnapshotAsync(
                projectId, newDiskName, disk, snapshot, _utils.GetLastPart(disk.Type), eraseVss);
            if (newDisk != null) {
              result[disk.Name] = newDisk;
            } else {
              _logger.LogError($"Creating disk {newDiskName} from snapshot failed!");
            }
          }
          return result;
        }));
      }
      Task.WaitAll(tasks.ToArray());
      Dictionary<string, ComputeData.Disk?> results = new Dictionary<string, ComputeData.Disk?>();
      foreach (var task in tasks) {
        Dictionary<string, ComputeData.Disk> result = task.Result;
        foreach (KeyValuePair<string, ComputeData.Disk> entry in result) {
          results[entry.Key] = entry.Value;
        }
      }
      return results;
    }

#pragma warning disable CS8602
    // Attaches a new disk to an instance
    public async Task<bool> AttachNewDisksAsync(string projectId, string snapshotPrefix,
                                                ComputeData.Instance instance,
                                                Dictionary<string, ComputeData.Disk?> disks) {
      foreach (ComputeData.AttachedDisk disk in instance.Disks) {
        string diskName = _utils.GetLastPart(disk.Source);
        string zone = _utils.GetLastPartN(disk.Source, 3);
        string diskType = _utils.GetLastPartN(disk.Source, 4);

        if (!disks.ContainsKey(diskName) || disks[diskName] == null) {
          _logger.LogError($"Can't find the new disk for attached disk {diskName}, skipping!");
          continue;
        }

        _logger.LogInformation(
            $"Detaching disk {diskName} (device name {disk.DeviceName}) from {instance.Name}...");
        ComputeV1.InstancesResource.DetachDiskRequest request = computeService.Instances.DetachDisk(
            projectId, _utils.GetLastPart(instance.Zone), instance.Name, disk.DeviceName);
        ComputeData.Operation response = request.Execute();
        bool done = false;
        if (diskType == "regions") {
          string region = _utils.GetLastPart(disks[diskName].Region);
          done = await _operations.WaitForOperation(projectId, Operations.ZONE,
                                                    _utils.GetLastPart(instance.Zone),
                                                    _utils.GetLastPart(response.SelfLink));

          _logger.LogInformation($"Adding commit lookup label to regional disk {diskName}...");
          var oldDisk = await GetRegionalDiskAsync(projectId, region, diskName);

          ComputeData.RegionSetLabelsRequest labelRequestBody =
              new ComputeData.RegionSetLabelsRequest();
          if (oldDisk.Labels == null) {
            labelRequestBody.Labels = new Dictionary<string, string>();
          } else {
            labelRequestBody.Labels = oldDisk.Labels;
          }
          labelRequestBody.Labels["gsnapshot"] =
              $"{snapshotPrefix}-{_utils.GetLastPart(oldDisk.Type)}-{oldDisk.Name}";
          if (labelRequestBody.Labels["gsnapshot"].Length > 63) {
            labelRequestBody.Labels["gsnapshot"] =
                labelRequestBody.Labels["gsnapshot"].Substring(0, 63);
          }
          labelRequestBody.LabelFingerprint = oldDisk.LabelFingerprint;
          ComputeV1.RegionDisksResource.SetLabelsRequest labelRequest =
              computeService.RegionDisks.SetLabels(labelRequestBody, projectId, region, diskName);
          ComputeData.Operation labelResponse = labelRequest.Execute();

          done = await _operations.WaitForOperation(projectId, Operations.REGION, region,
                                                    _utils.GetLastPart(labelResponse.SelfLink));
        } else {
          done = await _operations.WaitForOperation(projectId, Operations.ZONE, zone,
                                                    _utils.GetLastPart(response.SelfLink));

          _logger.LogInformation($"Adding commit lookup label to zonal disk {diskName}...");
          var oldDisk = await GetDiskAsync(projectId, zone, diskName);

          ComputeData.ZoneSetLabelsRequest labelRequestBody =
              new ComputeData.ZoneSetLabelsRequest();
          if (oldDisk.Labels == null) {
            labelRequestBody.Labels = new Dictionary<string, string>();
          } else {
            labelRequestBody.Labels = oldDisk.Labels;
          }
          labelRequestBody.LabelFingerprint = oldDisk.LabelFingerprint;
          labelRequestBody.Labels["gsnapshot"] =
              $"{snapshotPrefix}-{_utils.GetLastPart(oldDisk.Type)}-{oldDisk.Name}";
          if (labelRequestBody.Labels["gsnapshot"].Length > 63) {
            labelRequestBody.Labels["gsnapshot"] =
                labelRequestBody.Labels["gsnapshot"].Substring(0, 63);
          }
          ComputeV1.DisksResource.SetLabelsRequest labelRequest =
              computeService.Disks.SetLabels(labelRequestBody, projectId, zone, diskName);
          ComputeData.Operation labelResponse = labelRequest.Execute();

          done = await _operations.WaitForOperation(projectId, Operations.ZONE, zone,
                                                    _utils.GetLastPart(labelResponse.SelfLink));
        }

        _logger.LogInformation($"Attaching new disk {disks[diskName].Name} to {instance.Name}...");
        ComputeData.AttachedDisk attachRequestBody = new ComputeData.AttachedDisk();
        attachRequestBody.Source = disks[diskName].SelfLink;
        attachRequestBody.Mode = disk.Mode;
        attachRequestBody.DeviceName = disk.DeviceName;
        attachRequestBody.Boot = disk.Boot;
        ComputeV1.InstancesResource.AttachDiskRequest attachRequest =
            computeService.Instances.AttachDisk(attachRequestBody, projectId,
                                                _utils.GetLastPart(instance.Zone), instance.Name);
        ComputeData.Operation attachResponse = attachRequest.Execute();
        done = await _operations.WaitForOperation(projectId, Operations.ZONE,
                                                  _utils.GetLastPart(attachResponse.Zone),
                                                  _utils.GetLastPart(attachResponse.SelfLink));
        _logger.LogInformation($"Disk {disks[diskName].Name} attached to {instance.Name}.");
      }
      return true;
    }
  }
}