# Update GCE Instance disk-type

Update disks attached to a GCE instance.

## Script Process

1. Stop the VM instance
1. Get a list of the disks attached to the VM instance
1. For each disk attached to the instance
    1. Detach the disk from the VM instance
    1. Snapshot the disk
1. Attach the disk to the VM instance
1. Start the VM instance
1. Delete the old disks and snapshots created during the process (if 
specified)

## Usage

A command-line runnable Python 3 script has been provided and has the 
following
usage:

```
usage: main.py [-h] --project PROJECT --zone ZONE --instance INSTANCE --new_disk_type
KEYVERSION [--key-global]
               [--destructive]
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

If further automation is required, e.g. running the process for multiple 
GCP
instances, the `migrate_instance_to_cmek` function is a good starting 
point and
it takes the same parameters as the command-line interface.
