# [Global DNS -> Zonal DNS] Project Bulk Migration Script

This shell script helps to bulk-migrate projects from Global DNS to Zonal DNS.

Reference: https://cloud.google.com/compute/docs/internal-dns#migrating-to-zonal 

## Installing / Getting started

There are two prerequisites:
- Install [`jq`](https://jqlang.github.io/jq/download/) - A json processor.
- Install [`gcloud`](https://cloud.google.com/sdk/gcloud) - The script calls gcloud commands.

```shell
sudo apt-get install jq
sudo apt install -y google-cloud-sdk
```

They should be installed by running the above commands.

## Features

This shell script takes a list of project IDs as input (whether they are ready
or not), iterating through them, determining if each of them is ready for
gDNS-zDNS migration and if so, perform the migration (see dry_run below). The 
script is aimed to migrate the given projects if ready, or let the users know 
the reason why the projects are not ready to migrate. The reasons can include 
but not limited to:
- inaccessible project (project id does not exist or the current user does not have permission to access the project)
- inaccessbile metrics (the current user doesn not have permission to access the project's Cloud Monitoring metrics)
- not ready for migration (incompatible with ZonalOnly settings)
- have been using Zonal DNS already (no action needed)

If you have any questions about the migration, please refer to https://cloud.google.com/compute/docs/internal-dns#migrating-to-zonal for more information.

## Configuration

There are two command-line flags:

#### project_id
Type: `String` - A list of project IDs, separated by comma  
Default: `N/A` - No default value. This is a required field.

The script will process each project_id provided and check if they are ready
for the migration and perform the migration if ready (with dry_run disabled,
see below); If not ready, or encountered any errors, it will print out the 
reasons.

Example:
```bash
bash migration --project_id=p1,p2,p3  # Check the availability and perform the migration for p1, p2 and p3
```

#### dry_run
Type: `Boolean`  
Default: `True`

If dry_run is enabled, and if provided projects are ready for migration,
then it will not actually perform the migration. Default is set to True.

Example:
```bash
bash migration --project_id=p1 # no actual migration even if p1 is ready
bash migration --project_id=p1 --dry_run=true # no actual migration even if p1 is ready
bash migration --project_id=p1 --dry_run=false # p1 will be migrated if it is ready
```

## Example Input and Output

The script prints out a summary at the end to tell the users which projects are:
- inaccessible project (project id does not exist or the current user does not have permission to access the project)
- inaccessbile metrics (the current user doesn not have permission to access the project's Cloud Monitoring metrics)
- not ready for migration (incompatible with ZonalOnly settings)
- have been using Zonal DNS already (no action needed)
- ready for migration (and migrated if `--dry_run=false`)

### Dry Run Example:

- p1, p2 - User has no access to the projects
- p3 - User has no access to the metrics
- p4, p5 - Projects are not ready for the migration
- p6, p7 - Projects are already using Zonal DNS and no action are needed
- p8, p9, p10 - Projects are ready to be migrated
```bash
bash migration --dry_run=true --project_ids=p1,p2,p3,p4,p5,p6,p7,p8,p9,p10
```
```
Checking project p1 ...
Checking project p2 ...
Checking project p3 ...
ERROR: (gcloud.compute.project-info.describe) Could not fetch resource:
 - Required 'compute.projects.get' permission for 'projects/p3'

migration: line 96: [[: {
  "code": 403,
  "message": "Permission denied (or the resource may not exist).",
  "status": "PERMISSION_DENIED",
  "details": [
    {
      "@type": "type.googleapis.com/google.rpc.DebugInfo",
      "detail": "Permission monitoring.timeSeries.list denied on projects/123456789: no extra explanation needed."
    }
  ]
}: syntax error: operand expected (error token is "{
  "code": 403,
  "message": "Permission denied (or the resource may not exist).",
  "status": "PERMISSION_DENIED",
  "details": [
    {
      "@type": "type.googleapis.com/google.rpc.DebugInfo",
      "detail": "Permission monitoring.timeSeries.list denied on projects/123456789: no extra explanation needed."
    }
  ]
}")
Checking project p4 ...
Checking project p5 ...
Checking project p6 ...
Checking project p7 ...
Checking project p8 ...
Checking project p9 ...
Checking project p10 ...

================================Summary================================

Unable to access the following 2 projects, make sure the
projects exist or you have the right permissions:
- p1
- p2
---------------------------------------------------------------------

Unable to access the metrics for the following 1 projects,
please make sure you have the right permissions:
- p3
---------------------------------------------------------------------

The following 2 projects are incompatible with zonal-only
settings and require additional action before migration.
Learn more here:
https://cloud.google.com/compute/docs/internal-dns#migrating-to-zonal:
- p4
- p5
---------------------------------------------------------------------

The following 2 projects are using Zonal DNS and no action needed:
- p6
- p7
---------------------------------------------------------------------

The following 1 projects are compatible with zonal-only
settings and can be migrated to Zonal DNS. Please set
`--dry_run=false` in real run to migrate these projects.
Learn more here:
https://cloud.google.com/compute/docs/internal-dns#migrating-to-zonal.
- p8
- p9
- p10
```

### Real Run Example:
- p1, p2 - Projects are not ready for the migration
- p3, p4 - Projects are ready to be migrated
```bash
bash migration --dry_run=false --project_ids=p1,p2,p3,p4
```
```
Checking project p1 ...
Checking project p2 ...
Checking project p3 ...
Checking project p4 ...

================================Summary================================

The following 2 projects are incompatible with zonal-only
settings and require additional action before migration.
Learn more here:
https://cloud.google.com/compute/docs/internal-dns#migrating-to-zonal:
- p1
- p2
------------------------------------------------------------------------

The following 2 projects were ready and migrated to Zonal DNS:
- p3
- p4

================================Summary================================

```

## Rollback

If you see any issues or for any other reasons you want to rollback after the
migration, please see https://cloud.google.com/compute/docs/internal-dns#disabling-zonal-dns.

## Links

- Zonal DNS Migration: https://cloud.google.com/compute/docs/internal-dns#migrating-to-zonal