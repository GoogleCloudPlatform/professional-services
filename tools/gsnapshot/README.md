# ![gsnapshot](img/logo.png "gsnapshot")

`gsnapshot` in an utility written in C# and .NET Core that performs three functions:

  - Snapshotting all disks on an instance concurrently
  - Rolling back the instances disks to the snapshots
  - Committing the changes by erasing the snapshot

The tool also supports:

  - Rolling back an instance to snapshots done on a snapshot schedule
  - Turning on snapshot schedule for all disks on an instance


## Installation

### Build requirements

 - [.NET SDK 5.0](https://dotnet.microsoft.com/download)
 - [msitools](https://wiki.gnome.org/msitools) to build .MSI packages in OS X or Linux

Clone the code and run `make all` to build all targets.

To build for Mac OS X:

```
# make osx-x64
# ls -l bin/gsnapshot-1.2.0-osx-x64.tar.gz

(or manually)
# dotnet publish -r osx-x64 --self-contained=true -c Release -p:PublishSingleFile=true -p:PublishTrimmed=true
# ls -l bin/Release/netcoreapp5.0/osx-x64/publish/
```

To build for Linux:

```
# make linux-x64
# ls -l bin/gsnapshot-1.2.0-linux-x64.tar.gz

(or manually)
# dotnet publish -r linux-x64 --self-contained=true -c Release -p:PublishSingleFile=true -p:PublishTrimmed=true
# ls -l bin/Release/netcoreapp5.0/linux-x64/publish/
```

To build for Windows (64-bit):

```
# make windows-x64
# ls -l bin/gsnapshot-1.2.0.msi
(or manually)
# dotnet publish -r win-x64 --self-contained=true -c Release -p:PublishSingleFile=true -p:PublishTrimmed=true
# ls -l bin/Release/netcoreapp5.0/win-x64/publish/
```

## Usage

Authenticate with `gcloud auth application-default login` before using the application or set
the environment variable `GOOGLE_APPLICATION_CREDENTIALS` to point to a Service Account key file.

The application will try to read default project and region from `gcloud` settings.

```
taneli-macbookpro2:gsnapshot taneli$ dotnet run -- --help
gsnapshot 1.2.0
Copyright (c) 2021 Google LLC

  -v, --verbose     Set output to verbose messages.

  --erasevss        (Default: true) Erase Windows VSS signature when creating disks.

  --stop            Stop server during snapshots and rollbacks.

  --start           Start server after snapshotting or rolling back.

  --force           Force operation.

  --delete          Automatically delete snapshots when committing.

  -p, --project     Set Google Cloud Platform project ID.

  -r, --region      Set region for Compute Engine resources.

  -i, --instance    Set Compute Engine instance.

  -l, --location    (Default: match) Snapshot location ("eu", "us", "asia" or "match" to match VM region).

  --sid             (Default: 0) Snapshot ID (0 = find next available).

  --scheduled-id    Scheduled snapshot ID.

  --schedule        Snapshot schedule name (use --force to clear other policies).

  --help            Display this help screen.

  --version         Display version information.
```

## Examples: manual snapshots

To snapshot an instance, run:

```
# gsnapshot -p project-id -i instance-name -r europe-north1 snapshot
```

To rollback to a snapshot:

```
# gsnapshot -p project-id -i instance-name -r europe-north1 rollback
```

Instance will be shutdown, new disks created from snapshots and attached to instance. Finally, the instance
can be started. Please note that the original disks remain, but they will get a `gsnapshot` label. If
you no longer need the original disks, you can delete them.

To commit and remove the snapshots, run:

```
# gsnapshot -p project-id -i instance-name -r europe-north1 commit
```

## Examples: scheduled snapshots

To rollback to a scheduled snapshot:

```
# gsnapshot -p project-id -i instance-name -r europe-north1 rollback-scheduled
```

To set a snapshot schedule for instance:

```
# gsnapshot -p project-id -i instance-name -r europe-north1 schedule-snapshot --schedule my-snapshot-schedule
```


