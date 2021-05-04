# Update GCE Disks Endription Key in use

Update disks attached to a GCE instance to customer-managed encryption keys 
stored in Cloud KMS. This operation is performed in-place so the GCE VM 
instance maintains its current IP-address.

## Script Process

1. Stop the VM instance
1. Get a list of the disks attached to the VM instance
1. For each disk attached to the disk
    1. If it is already encrypted with the specified CMEK key we skip the disk
    1. Detach the disk from the VM instance
    1. Snapshot the disk
    1. We then create a new disk using the CMEK key stored in Cloud KMS
1. Attach the disk to the VM instance
1. Start the VM instance
1. Delete the old disks and snapshots created during the process (if specified)

## Usage

A command-line runnable Python 3 script has been provided and has the following
usage:

```
usage: main.py [-h] --project PROJECT --zone ZONE --instance INSTANCE
               --key-ring KEYRING --key-name KEYNAME --key-version KEYVERSION [--key-global]
               [--destructive]

arguments:
  -h, --help            show this help message and exit
  --project PROJECT     Project containing the GCE instance.
  --zone ZONE           Zone containing the GCE instance.
  --instance INSTANCE   Instance name.
  --key-ring KEYRING    Name of the key ring containing the key to encrypt the
                        disks. Must be in the same region as the instance or global.
  --key-name KEYNAME    Name of the key to encrypt the disks. Must be in the
                        same region as the instance or global.
  --key-version KEYVERSION
                        Version of the key to encrypt the disks.
  --key-global          Use Cloud KMS global keys.
  --destructive         Upon completion, delete source disks and snapshots
                        created during migration process.
```

The script uses Google [Application Default Credentials](https://cloud.google.com/docs/authentication/production).

If further automation is required, e.g. running the process for multiple GCP
instances, the `migrate_instance_to_cmek` function is a good starting point and
it takes the same parameters as the command-line interface.
