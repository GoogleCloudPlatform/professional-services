# Update GCE Instance disk-type

Script to change disk type of disks attached to a GCE instance.

## Script Process

1. Stop the VM instance
1. Get a list of the disks attached to the VM instance
1. For each disk attached to the instance
    1. Detach the disk from the VM instance
    1. Snapshot the disk
    1. Create a user supplied disk-type from snapshot
1. Attach the disk to the VM instance
1. Start the VM instance
1. Delete the old disks and snapshots created during the process (if 
specified)

## Usage

A command-line runnable Python 3 script has been provided and has the 
following
usage:

```
usage: main.py [-h] --project PROJECT --zone ZONE --instance INSTANCE --new_disk_type [--destructive]
arguments:
  -h, --help            show this help message and exit
  --project PROJECT     Project containing the GCE instance.
  --zone ZONE           Zone containing the GCE instance.
  --instance INSTANCE   Instance name.
  --disktype             Disk type(pd-standard, pd-balanced, pd-ssd, pd-extreme)
                        disks. Must be in the same region as the instance or global.
  --destructive         Upon completion, delete source disks and snapshots
                        created during migration process.
```

The script uses Google [Application Default 
Credentials](https://cloud.google.com/docs/authentication/production).
