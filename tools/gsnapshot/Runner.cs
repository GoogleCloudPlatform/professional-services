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
  public class Runner {
    private readonly ILogger<Runner> _logger;
    public Dictionary<string, string>? Projects;
    public List<string> RegionsToQuery = new List<string>();

    public static string Version = "1.2.0";

    private readonly Resources _resources;
    private readonly Disks _disks;
    private readonly Snapshots _snapshots;
    private readonly Instances _instances;
    private readonly Operations _operations;
    private readonly Utils _utils;

    public Runner(ILogger<Runner> logger) {
      _logger = logger;
      _utils = new Utils(_logger);
      _operations = new Operations(_logger);
      _resources = new Resources(_logger, _utils);
      _snapshots = new Snapshots(_logger, _utils, _operations);
      _disks = new Disks(_logger, _utils, _operations, _snapshots);
      _snapshots.SetDisks(_disks);
      _instances = new Instances(_logger, _utils, _operations, _disks);
    }

    private string? PickInstance() {
      Dictionary<string, string> instances = new Dictionary<string, string>();
      foreach (string instance in _instances.AllInstances.Keys) {
        instances[instance] = instance;
      }
      ReadLine.AutoCompletionHandler = new AutoCompletionHandler(instances);
      var oldColor = Console.ForegroundColor;
      Console.ForegroundColor = ConsoleColor.White;
      string region = ReadLine.Read("Instance (tab to autocomplete, ^C to cancel)> ");
      Console.ForegroundColor = oldColor;
      return region;
    }

    private string? PickRegion() {
      ReadLine.AutoCompletionHandler = new AutoCompletionHandler(_resources.AllRegions);
      var oldColor = Console.ForegroundColor;
      Console.ForegroundColor = ConsoleColor.White;
      string region = ReadLine.Read("Region (empty for all, tab to autocomplete, ^C to cancel)> ");
      Console.ForegroundColor = oldColor;
      return region;
    }

    private string? PickProject() {
      _logger.LogInformation("Retrieving list of projects...");
      Dictionary<string, string> Projects = _resources.GetAllProjects();

      ReadLine.AutoCompletionHandler = new AutoCompletionHandler(Projects);
      var oldColor = Console.ForegroundColor;
      Console.ForegroundColor = ConsoleColor.White;
      string projectId = ReadLine.Read("Project ID (tab to autocomplete, ^C to cancel)> ");
      Console.ForegroundColor = oldColor;
      return projectId;
    }

#pragma warning restore CS8602

    private bool CheckProjectAndInstance(Options options) {
      if (String.IsNullOrEmpty(options.Project)) {
        _logger.LogCritical("No project specified!");
        return false;
      }
      if (String.IsNullOrEmpty(options.Instance)) {
        _logger.LogCritical("No instance specified!");
        return false;
      }
      return true;
    }

#pragma warning disable CS8604
    private void Snapshot(Options options) {
      if (!CheckProjectAndInstance(options)) {
        return;
      }
      _instances.CheckInstanceRunning(options.Project, _instances.AllInstances[options.Instance],
                                      options.Stop, "snapshot");
      Dictionary<string, Tuple<ComputeData.Disk, ComputeData.Snapshot>> disks =
          _snapshots
              .SnapshotInstanceDisksAsync(options.Project,
                                          _instances.AllInstances[options.Instance],
                                          options.Location, options.ID, options.Force)
              .GetAwaiter()
              .GetResult();
      _logger.LogInformation($"Snapshots created:");
      int diskNameLength = 0, snapshotNameLength = 0;
      foreach (KeyValuePair<string, Tuple<ComputeData.Disk, ComputeData.Snapshot>> entry in disks) {
        if (entry.Value.Item1.Name.Length > diskNameLength) {
          diskNameLength = entry.Value.Item1.Name.Length;
        }
        if (entry.Value.Item2.Name.Length > snapshotNameLength) {
          snapshotNameLength = entry.Value.Item2.Name.Length;
        }
      }
      foreach (KeyValuePair<string, Tuple<ComputeData.Disk, ComputeData.Snapshot>> entry in disks) {
        if (entry.Value != null && entry.Value.Item1 != null && entry.Value.Item2 != null &&
            entry.Value.Item2.StorageBytes != null) {
          var size = ByteSize.FromBytes((double)entry.Value.Item2.StorageBytes);
          string _disk = String.Format("{0,-" + diskNameLength + "}", entry.Value.Item1.Name);
          string _snapshot =
              String.Format("{0,-" + snapshotNameLength + "}", entry.Value.Item2.Name);
          _logger.LogInformation(
              $"  Disk: {_disk}  Snapshot: {_snapshot}  Size: {size.ToString()}");
        }
      }
      var instance =
          _instances.GetInstance(options.Project, _instances.AllInstances[options.Instance]);
      if (instance.Status == "TERMINATED") {
        bool startServer = options.Start;
        if (!options.Start) {
          _logger.LogWarning($"Instance is stopped, do you want to start it?");
          startServer = _utils.GetYesNo("Start server (y/N)?", false);
        }
        if (startServer) {
          _logger.LogInformation($"Starting instance {instance.Name}...");
          bool instanceStarted =
              _instances.StartInstance(options.Project, instance).GetAwaiter().GetResult();
          ;
        }
      }
      _logger.LogInformation("Instance snapshot finished.");
    }

    private void Rollback(Options options) {
      if (!CheckProjectAndInstance(options)) {
        return;
      }
      Dictionary<string, ComputeData.Disk?> newDisks =
          _disks
              .CreateRollbackDisksAsync(options.Project, _instances.AllInstances[options.Instance],
                                        options.ID, options.Force, options.EraseVSS)
              .GetAwaiter()
              .GetResult();
      _instances.CheckInstanceRunning(options.Project, _instances.AllInstances[options.Instance],
                                      options.Stop, "rollback");

      string snapshotName = $"gsnapshot-{options.ID}";
      bool done = _disks
                      .AttachNewDisksAsync(options.Project, snapshotName,
                                           _instances.AllInstances[options.Instance], newDisks)
                      .GetAwaiter()
                      .GetResult();
      if (done) {
        _logger.LogInformation($"Rollback finished for snapshot #{options.ID}!");
        var rollbackInstance =
            _instances.GetInstance(options.Project, _instances.AllInstances[options.Instance]);
        if (rollbackInstance.Status == "TERMINATED") {
          bool startServer = options.Start;
          if (!options.Start) {
            _logger.LogWarning($"Instance is stopped, do you want to start it?");
            startServer = _utils.GetYesNo("Start server (Y/n)?", true);
          }
          if (startServer) {
            _logger.LogInformation($"Starting instance {rollbackInstance.Name}...");
            bool instanceStarted =
                _instances.StartInstance(options.Project, _instances.AllInstances[options.Instance])
                    .GetAwaiter()
                    .GetResult();
          }
        }
      } else {
        _logger.LogWarning($"Rollback was not entirely completed.");
      }
      _logger.LogInformation("Instance rollback finished.");
    }

    private void RollbackScheduled(Options options) {
      if (!CheckProjectAndInstance(options)) {
        return;
      }

      Dictionary<string, Dictionary<string, Tuple<ComputeData.Disk, ComputeData.Snapshot?>>>
          snapshots = _snapshots
                          .GetScheduledSnapshotsForInstance(
                              options.Project, _instances.AllInstances[options.Instance])
                          .GetAwaiter()
                          .GetResult();

      var rollbackInstance =
          _instances.GetInstance(options.Project, _instances.AllInstances[options.Instance]);

      Dictionary<string, string> allSnapshots = new Dictionary<string, string>();
      _logger.LogInformation(
          $"Found the following scheduled snapshots for {rollbackInstance.Name}:");
      foreach (KeyValuePair<string,
                            Dictionary<string, Tuple<ComputeData.Disk, ComputeData.Snapshot?>>>
                   entry in snapshots) {
        allSnapshots[entry.Key] = entry.Key;
        _logger.LogInformation($"  Snapshot ID: {entry.Key}");
        int diskNameLength = 0, snapshotNameLength = 0, timestampLength = 0;
        foreach (KeyValuePair<string, Tuple<ComputeData.Disk, ComputeData.Snapshot?>> disk in entry
                     .Value) {
          string diskName = _utils.GetLastPart(disk.Key);
          if (diskName.Length > diskNameLength) {
            diskNameLength = diskName.Length;
          }
          if (disk.Value.Item2 != null) {
            if (disk.Value.Item2.Name.Length > snapshotNameLength) {
              snapshotNameLength = disk.Value.Item2.Name.Length;
            }
            string timestamp =
                DateTimeOffset.Parse(disk.Value.Item2.CreationTimestamp).ToLocalTime().ToString();
            if (timestamp.Length > timestampLength) {
              timestampLength = timestamp.Length;
            }
          }
        }

        foreach (KeyValuePair<string, Tuple<ComputeData.Disk, ComputeData.Snapshot?>> disk in entry
                     .Value) {
          string diskName = _utils.GetLastPart(disk.Key);
          string _disk = String.Format("{0,-" + diskNameLength + "}", diskName);
          if (disk.Value.Item2 != null && disk.Value.Item2.StorageBytes != null) {
            string snapshotName = disk.Value.Item2.Name;
            var size = ByteSize.FromBytes((double)disk.Value.Item2.StorageBytes);
            string _snapshot = String.Format("{0,-" + snapshotNameLength + "}", snapshotName);
            string timestamp = String.Format(
                "{0,-" + timestampLength + "}",
                DateTimeOffset.Parse(disk.Value.Item2.CreationTimestamp).ToLocalTime().ToString());

            _logger.LogInformation(
                $"    Disk: {_disk}  Snapshot: {_snapshot}  Timestamp: {timestamp}  Size: {size.ToString()}");
          } else {
            string _snapshot = String.Format("{0,-" + snapshotNameLength + "}", "N/A");
            string timestamp = String.Format("{0,-" + timestampLength + "}", "N/A");
            _logger.LogInformation(
                $"    Disk: {_disk}  Snapshot: {_snapshot}  Timestamp: {timestamp}  Size: N/A");
          }
        }
      }
      string snapshotId = "";
      if (!String.IsNullOrEmpty(options.ScheduledID)) {
        if (snapshots.ContainsKey(options.ScheduledID)) {
          _logger.LogInformation($"Rolling back to snapshot ID: {options.ScheduledID}");
          snapshotId = options.ScheduledID;
        } else {
          _logger.LogCritical($"Unknown snapshot ID specified: {options.ScheduledID}");
          System.Environment.Exit(11);
        }
      }

      if (String.IsNullOrEmpty(snapshotId)) {
        ReadLine.AutoCompletionHandler = new AutoCompletionHandler(allSnapshots);
        var oldColor = Console.ForegroundColor;
        Console.ForegroundColor = ConsoleColor.White;
        snapshotId = ReadLine.Read(
            "Snapshot ID for rollback (empty for all, tab to autocomplete, ^C to cancel)> ");
        Console.ForegroundColor = oldColor;
      }
      if (String.IsNullOrEmpty(snapshotId) || !snapshots.ContainsKey(snapshotId)) {
        _logger.LogCritical($"Unknown snapshot ID specified: {snapshotId}");
        System.Environment.Exit(11);
      }
      Dictionary<string, Tuple<ComputeData.Disk, ComputeData.Snapshot>> rollbacks =
          new Dictionary<string, Tuple<ComputeData.Disk, ComputeData.Snapshot>>();
      foreach (KeyValuePair<string, Tuple<ComputeData.Disk, ComputeData.Snapshot?>> entry in
                   snapshots[snapshotId]) {
        rollbacks[entry.Key] =
            new Tuple<ComputeData.Disk, ComputeData.Snapshot>(entry.Value.Item1, entry.Value.Item2);
      }

      Dictionary<string, ComputeData.Disk?> newDisks =
          _disks
              .CreateScheduledRollbackDisksAsync(options.Project,
                                                 _instances.AllInstances[options.Instance],
                                                 rollbacks, options.EraseVSS)
              .GetAwaiter()
              .GetResult();

      _instances.CheckInstanceRunning(options.Project, _instances.AllInstances[options.Instance],
                                      options.Stop, "rollback");

      string snapshotPrefix = $"gsnapshot-scheduled-{snapshotId}";
      bool done = _disks
                      .AttachNewDisksAsync(options.Project, snapshotPrefix,
                                           _instances.AllInstances[options.Instance], newDisks)
                      .GetAwaiter()
                      .GetResult();
      if (done) {
        _logger.LogInformation($"Rollback finished for snapshot ID {snapshotId}!");
        rollbackInstance =
            _instances.GetInstance(options.Project, _instances.AllInstances[options.Instance]);
        if (rollbackInstance.Status == "TERMINATED") {
          bool startServer = options.Start;
          if (!options.Start) {
            _logger.LogWarning($"Instance is stopped, do you want to start it?");
            startServer = _utils.GetYesNo("Start server (Y/n)?", true);
          }
          if (startServer) {
            _logger.LogInformation($"Starting instance {rollbackInstance.Name}...");
            bool serverStarted =
                _instances.StartInstance(options.Project, _instances.AllInstances[options.Instance])
                    .GetAwaiter()
                    .GetResult();
          }
        }
      } else {
        _logger.LogWarning($"Rollback was not entirely completed.");
      }
      _logger.LogInformation("Instance rollback finished.");
    }

    private void ScheduleSnapshot(Options options) {
      if (!CheckProjectAndInstance(options)) {
        return;
      }

      if (String.IsNullOrEmpty(options.Schedule)) {
        _logger.LogError("No snapshot schedule name was specified (use --schedule parameter).");
        System.Environment.Exit(13);
      }

      var instance =
          _instances.GetInstance(options.Project, _instances.AllInstances[options.Instance]);
      var schedule =
          _snapshots.GetSnapshotSchedule(options.Project, options.Schedule, options.Region)
              .GetAwaiter()
              .GetResult();
      if (schedule == null) {
        _logger.LogCritical($"Snapshot schedule {options.Schedule} was not found.");
        System.Environment.Exit(13);
      }
      if (options.Force) {
        var clearDone =
            _snapshots
                .ClearInstanceSnapshotSchedule(options.Project, schedule.SelfLink, options.Region,
                                               _instances.AllInstances[options.Instance])
                .GetAwaiter()
                .GetResult();
        if (clearDone) {
          _logger.LogInformation($"Snapshot schedules cleared for instance {instance.Name}.");
        } else {
          _logger.LogWarning(
              $"There were errors clearing snapshot schedules for instance {instance.Name}.");
        }
      }
      var done =
          _snapshots
              .AddInstanceSnapshotSchedule(options.Project, schedule.SelfLink, options.Region,
                                           _instances.AllInstances[options.Instance])
              .GetAwaiter()
              .GetResult();
      if (done) {
        _logger.LogInformation($"Snapshot schedules set for instance {instance.Name}.");
      } else {
        _logger.LogWarning(
            $"There were errors setting snapshot schedules for instance {instance.Name}.");
      }
    }
    public void Commit(Options options) {
      if (!CheckProjectAndInstance(options)) {
        return;
      }
      _snapshots
          .DeleteSnapshotsAsync(options.Project, _instances.AllInstances[options.Instance],
                                options.ID, options.Delete)
          .GetAwaiter()
          .GetResult();
      _logger.LogInformation("Commit finished.");
    }
#pragma warning restore CS8604

    public void DoAction(Options options) {
      _logger.LogInformation($"gsnapshot {Version} - a snapshot/rollback utility");
      switch (options.Command) {
        case "snapshot":
          _logger.LogInformation("Operation specified: begin changes (create snapshots)");
          break;
        case "schedule-snapshot":
          _logger.LogInformation(
              "Operation specified: schedule snapshots (attach snapshot schedule to all of instance's disks)");
          break;
        case "rollback":
          _logger.LogInformation(
              "Operation specified: rollback changes (create new disks from snapshots and attach)");
          break;
        case "rollback-scheduled":
          _logger.LogInformation(
              "Operation specified: rollback to previous state (create new disks from scheduled snapshots and attach)");
          break;
        case "commit":
          _logger.LogInformation("Operation specified: commit changes (remove snapshots)");
          break;
        default:
          _logger.LogCritical(
              "Command not selected, select one of: snapshot, schedule-snapshot, rollback, rollback-scheduled, commit");
          string fileName = "gsnapshot";
          var currentProcess = System.Diagnostics.Process.GetCurrentProcess();
          if (currentProcess?.MainModule?.FileName != null) {
            fileName = currentProcess.MainModule.FileName;
          }
          _logger.LogCritical($"  Usage: {fileName} command [parameters...]");
          _logger.LogCritical("");
          _logger.LogCritical(
              "  snapshot             Takes a snapshot of a specified Compute Engine instance.");
          _logger.LogCritical(
              "  schedule-snapshot    Attaches a snapshot schedule to all disks of a Compute Engine instance.");
          _logger.LogCritical("  rollback             Rolls back to a previously made snapshot.");
          _logger.LogCritical(
              "  rollback-scheduled   Rolls back to a previous snapshot from a snapshot schedule.");
          _logger.LogCritical("  commit               Deletes previously made snapshots.");
          _logger.LogCritical("");
          System.Environment.Exit(2);
          break;
      }

      ReadDefaultSettings(options);
      if (String.IsNullOrEmpty(options.Project)) {
        options.Project = PickProject();
        if (String.IsNullOrEmpty(options.Project)) {
          _logger.LogCritical(
              "Project ID was not set, either enter it manually or specify via command line.");
          System.Environment.Exit(2);
        } else {
          _logger.LogInformation($"Selected project: {options.Project}");
        }
      }

      _resources.LoadAllZones(options.Project);
      if (String.IsNullOrEmpty(options.Region)) {
        _resources.LoadAllRegions(options.Project);
        options.Region = PickRegion();
        if (String.IsNullOrEmpty(options.Region)) {
          foreach (string region in _resources.AllRegions.Keys) {
            RegionsToQuery.Add(region);
          }
          _logger.LogWarning(
              $"Region was not set, querying all regions ({RegionsToQuery.Count} regions).");
        } else {
          if (_resources.AllRegions.ContainsKey(options.Region)) {
            _logger.LogInformation($"Selected region: {options.Region}");
            RegionsToQuery.Add(options.Region);
          } else {
            _logger.LogCritical($"Invalid region selected (\"{options.Region}\").");
            System.Environment.Exit(3);
          }
        }
      } else {
        _logger.LogInformation($"Selected region: {options.Region}");
        RegionsToQuery.Add(options.Region);
      }

      _instances.LoadInstances(options.Project, RegionsToQuery, _resources.AllZones);
      if (String.IsNullOrEmpty(options.Instance)) {
        options.Instance = PickInstance();
      }
      if (String.IsNullOrEmpty(options.Instance) ||
          !_instances.AllInstances.ContainsKey(options.Instance)) {
        _logger.LogCritical("Instance ID was not set, or set to non-existing instance.");
        System.Environment.Exit(4);
      }
      string description =
          _instances.GetMachineDescription(_instances.AllInstances[options.Instance]);
      _logger.LogInformation($"Selected instance: {options.Instance} ({description})");

      switch (options.Command) {
        case "snapshot":
          Snapshot(options);
          break;
        case "schedule-snapshot":
          ScheduleSnapshot(options);
          break;
        case "rollback":
          Rollback(options);
          break;
        case "rollback-scheduled":
          RollbackScheduled(options);
          break;
        case "commit":
          Commit(options);
          break;
      }
    }

    private void ReadDefaultSettings(Options options) {
      if (String.IsNullOrEmpty(options.Project)) {
        _logger.LogDebug("Reading default project settings using gcloud");
        string? gcloudProject = _utils.RunGcloud("config get-value project");
        if (gcloudProject != null) {
          options.Project = gcloudProject;
        }
      }

      if (String.IsNullOrEmpty(options.Region)) {
        string? gcloudRegion = _utils.RunGcloud("config get-value compute/region");
        if (gcloudRegion != null) {
          options.Region = gcloudRegion;
        }
      }
    }
  }
}