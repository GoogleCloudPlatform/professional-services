# GCP VM Migrator

This utility automates migrating Virtual Machine instances within GCP. You can migrate VMs from one zone to another zone/region within the same or different projects.

## Prerequisites

To be able to execute the utility, you should meet the following prerequisites:
1. Have access to this repository
2. Have at least Python 3.7 installed
3. Ideally have a Python3 environment
4. The service account with which you are running this script should be able to:
    * Create/Delete/Shutdown GCE VMs
    * Create/Delete VPC subnets
    * Create/Delete machine images
5. You should be able to create files on your filesystem to store the inventory data

## Setup

1. Clone this repository
2. Change directory to this directoy (tools/vm-migrator)
3. Optional if using a virtual environment: ```python3 -m venv venv```
4. Optional if using a virtual environment: ```source venv/bin/activate```
5. Run ```make install-requirements```
6. Run ```make install-tools```
7. Run ```make install```
8. Configure (see below)

## Testing

Run ```make test```

## Configuration

### 1. Edit Makefile - or set variables in the command line
The `Makefile` has different variables which are passed to the subnet_region_migratory.py.

These variables can be overridden from the command line:
```
make VARIABLE=VALUE migrate-subnet
```
The variables NOT marked as "[Optional]" are **mandatory**.

| Variable      | Value                              |
| ------------- | ---------------------------------- |
| STEP | The name of the step to run |
| MACHINE_IMAGE_REGION | The region where you want to store your machine images, e.g "us-central1" |
| SOURCE_PROJECT | Project ID where the VMs to be migrated are located |
| SOURCE_SUBNET | The source subnetwork URI, for example, "projects/my-host-project/regions/europe-west3/subnetworks/source-subnet" |
| SOURCE_ZONE | The zone in which the source subnet is present, this is used to fetch the inventory details, for example, "europe-west3-c" |
| SOURCE_ZONE_2 | [Optional] The second zone in which the source subnet is present, this is used to fetch the inventory details |
| SOURCE_ZONE_3 | [Optional] The third zone in which the source subnet is present, this is used to fetch the inventory details |
| TARGET_PROJECT | [Optional] If different from the source project, the Project ID where the new subnet will exist |
| TARGET_PROJECT_SA | Required if the target project is different than the source project, otherwise [Optional]. Used as Service Account on the target VMs. |
| TARGET_PROJECT_SA_SCOPES | [Optional] If the target project is different than the source project, scopes to assign to the Service Account on the VMs |
| TARGET_SUBNET | Leave this argument empty if you're just migrating VMs within the same subnet (and region) into a different service project. Otherwise the target subnetwork URI, for example, "projects/my-host-project/regions/us-central1/subnetworks/target-subnet" |
| BACKUP_SUBNET | [Optional] If you want to back up your instances to a subnet, specify the subnet's URI, for example, "projects/my-host-project/regions/us-central1/subnetworks/backup-subnet" |
| SOURCE_CSV | [Optional] (by default `source.csv`) The filename used by `prepare_inventory` |
| FILTER_CSV | [Optional] (by default `filter.csv`) File that contains the instance names that will be included by `filter_inventory` |
| INPUT_CSV | [Optional] (by default `export.csv`) The filtered list of machines created by `filter_inventory` used as input for the migration. |
| LOG_LEVEL | [Optional] Debugging level |

### 2. Edit the filter file
The FILTER_CSV variable from above has the name of the file that contains the instance names that will be included by the `filter_inventory` step. It is basically the list of the instances you actually want to migrate. Please either edit the filter.csv file or provide your file and change the variable value.

### 3. Edit the zone mapping file
The file ```src/migrator/zone_mapping.py``` contains the mapping of the zones - which will be migrated to which. If your zones are not there, please edit it and add them there.

## Supported Functionality

VM Migrator supports multiple functionality, each feature is triggered via the step name which is passed as a variable to the the script (see above).

While you can move all the machines in a subnet to the destination subnet, you have the flexibility to go with two approaches:

1. Bulk move approach, where you export all the machines running in one zone and subnet to destination zone and subnet. Since you are moving all the machines, you can drain the entire subnet, clone and recreate the subnet in the destination region.
    * This approach lets you keep the same IP ( Internal + Alias IPs ) of the source VM in the destination subnet
2. Individual machine move, in this approach you can move only some of the machines to the destination subnet. Since you are not draining the entire subnet, the cloned machines created will have a different IP from the source machine.

| STEP      | Description                              |
| ------------- | ---------------------------------- |
| prepare_inventory          | This will dump the entire inventory in the specified subnet and zones in CSV format into the `SOURCE_CSV` (by default `source.csv`).|
| filter_inventory     | Executes `prepare_inventory` and copies `SOURCE_CSV` to `INPUT_CSV` (by default `export.csv`) only selecting machines whose instance names match any row in `FILTER_CSV` (by default `filter.csv`). |
| shutdown_instances | This will shutdown all the machines whose details are found in the `INPUT_CSV` file, this is particularly useful when you want to shutdown the instances before taking their machine image |
| start_instances | This will start all the machines whose details are found in the `INPUT_CSV` file, this is particularly useful when you want to rollback the shutdown step |
| create_machine_images | This will create the machine image of the instances which are specifed in the `INPUT_CSV` file | 
| backup_instances | The backup functionality moves the original instances to a backup subnet you specify in the `BACKUP_SUBNET` variable. Please see the section "Backup" below for more information |
| prepare_rollback | This populates the `rollback.csv` file with instances to be moved from the backup subnet to the original one. Please see the section "Rollback" below for more information |
| rollback_instances | This moves the instances listed in `rollback.csv` from `BACKUP_SUBNET` to `SOURCE_SUBNET`. Please see the section "Rollback" below for more information |
| disable_deletionprotection_instances | This will disable the deletion protection on all instances in the `INPUT_CSV` file. In case it's enabled on any instances, this should be run before `delete_instances`. |
| delete_instances | This will delete the instances which are specifed in the `INPUT_CSV` file |
| release_ip | This will release all the internal static IP addresses of the instances which are specifed in the `INPUT_CSV` file |
| release_ip_for_subnet | This will release all the internal static IP addresses of the source subnet | 
| clone_subnet | This will delete and re-create the subnet in the destination region with the same config as the source subnet, this is required when you want to drain the entire subnet and create it in the destination region. Keep in mind that subnets can't be deleted from VPCs with auto subnet mode. |
| add_machineimage_iampolicies | This will provide the target project service account with the right permissions to access the source project machine images |
| create_instances | This will create the instances from the machine images in the destination subnet/region, it requires the destination subnet to be in place (if you are cloning the subnet, it will automatically be created) |
| create_instances_without_ip | This is similar to the create_instances step, just that it will not preserve the source IPs, this is useful in a situation when you are moving some of the machines to the destination subnet which has a different CIDR range |

## Running the Utility

Before running, please ensure that
- the latest code is pulled from repository
- the prerequisites are met
- your setup and configuration are complete

Run ```make STEP=<step name> migrate-subnet```

The tool will log to the file "migrator.log", located in the same directory.

## Sole Tenant nodes

The file ```node_group_mapping.py``` has the mapping of source and destination node groups. If you are moving machines which are running on sole tenant nodes, then the create_instances/create_instances_without_ip step will look for mapping of node groups, and it finds the mapping, it will use the specified node group in the destination subnet/region to run the VM on automatically.

## Shared VPC

In the case of migrating VMs in a Shared VPC, the source and target projects are the service projects where the VMs live. The host project is implicitly indicated in the URI of the source and target subnet.

## Upgrading Machine Types

In the process of migration you can optimize the machine types based on the usage. You can do that by providing the source and destination machine type mappings in ```machine_type_mapping.py```, e.g `n1-standard-1`: `n1-standard-4` would upgrade all the machines running with `n1-standard-1` to `n1-standard-4`.

## Backup and rollback

### Backup
The optional backup functionality (`backup_instances` step) does the following:
1. It moves the original instances to a backup subnet you specify in the `BACKUP_SUBNET` variable. You have to create a subnet for this manually since you need to specify a CIDR block that will work for you. This subnet has to be in the same region as the source subnet!
2. Renames the instances: adds a '0' symbol at the end of each instance's name. This is done so that you can still migrate your original instances with the same names. Please make sure that your instances' names are not too long and one more symbol can be added! This is not being checked in the script.

For usage see the examples below.

**Notes**:
1. Current limitations:
    - work only within one project
    - takes into account only one zone (no variables ZONE_2 and so on)
    - only one internal IP of the instances is taken into account
    - instances should only have one nic
2. In order to work the function needs a "fingerprint" - a unique identifier of the network interface of an instance. This is collected during the `prepare_inventory` step. The `backup_instances` step checks for those fingerprints and aborts if any are not found.
3. Please make sure you keep the `export.csv` file intact, since if you will need to roll back, this file will be needed (see next section).
4. **Important**: remember that for any operation requiring moving the instance between subnets it has to be stopped.

### Rollback
1. If you did not use the backup functionality, in order to rollback the changes please change the parameters of the source file and interchange the source and destination parameters. Please note that some steps like `create_machine_image` would not be required to run, as the machine images have already been created.

2. Otherwise, with backup, you first have to prepare the rollback with the `prepare_rollback` step, which populates the `rollback.csv` file with instances to be moved. This will also check the `export.csv` file to find the previous IPs of the instances and match them to the instances. If at least one is not found, the function aborts. Once the rollback file is populated, please check it to ensure the necessary instances get rolled back and that the right IP addresses get assigned.

    Then you execute the `rollback_instances` step, which moves the instances listed in `rollback.csv` from `BACKUP_SUBNET` to `SOURCE_SUBNET` and renames them to their original names.
    
    **Important**: remember that for any operation requiring moving the instance between subnets it has to be stopped.

    See the examples below.

### Clean up backup
If you backed up your instances and everything went well - you can just delete the backed up instances (this does NOT delete the backup subnet). But first you should list them to `rollback.csv` with the `prepare_rollback` step, so that you can check what will be deleted. Then:
```
make STEP=delete_instances INPUT_CSV=rollback.csv migrate-subnet
```
Be sure to specify the `rollback.csv` as input.

## Examples

There are certain common scenarios you might be interested in. All of them require you to fill the proper required parameters in the `Makefile` and the proper zone mapping in `zone_mapping.py`. Afterwards, you can execute the following recipes:

### Moving VMs across projects

This one requires a `TARGET_PROJECT`. By default, `TARGET_PROJECT_SA` points to the target project's compute engine service account.

```
# standard
make STEP=prepare_inventory migrate-subnet
make STEP=filter_inventory migrate-subnet
make STEP=shutdown_instances migrate-subnet
make STEP=create_machine_images migrate-subnet
make STEP=delete_instances migrate-subnet
# release VM static IPs
make STEP=release_ip migrate-subnet
# target service account requires access to the source machine images
make STEP=add_machineimage_iampolicies migrate-subnet
# create instances in the target project
make STEP=create_instances_without_ip migrate-subnet
```

### Move VMs across regions (recreate subnet)

This one requires the `TARGET_SUBNET` that indicates target host project, region and subnet name for the `clone_subnet` step.

```
# standard
make STEP=prepare_inventory migrate-subnet
make STEP=filter_inventory migrate-subnet
make STEP=shutdown_instances migrate-subnet
make STEP=create_machine_images migrate-subnet
make STEP=delete_instances migrate-subnet
# remove reserved static ips for this subnetwork
make STEP=release_ip_for_subnet migrate-subnet
# remove and recreate subnet in the same VPC but in the target region
make STEP=clone_subnet migrate-subnet
# recreate instances with the same IP in the recreated subnet
make STEP=create_instances migrate-subnet
```

**Note**: This case is particularly interesting if VMs need to stay *in the same VPC*. Otherwise, use the next example (move VMs to an existing subnet is a better fit).

### Move VMs to a different (existing) subnet

This step also requires `TARGET_SUBNET` to be defined (which indicates target host project and region implicitly). In this case it is also expected that this subnet already exists with the given definition.

```
# standard
make STEP=prepare_inventory migrate-subnet
make STEP=filter_inventory migrate-subnet
make STEP=shutdown_instances migrate-subnet
make STEP=create_machine_images migrate-subnet
make STEP=delete_instances migrate-subnet
# release VM static IPs
make STEP=release_ip migrate-subnet
# create instances in the target subnet
make STEP=create_instances_without_ip migrate-subnet
```

This recipe is fully compatible with moving across projects. In this case, please specify the `TARGET_PROJECT*` variables additionally and execute `make STEP=add_machineimage_iampolicies migrate-subnet` before creating the instances as well.


### Backup and Rollback

The backup functionality moves the original instances to a backup subnet you specify in the `BACKUP_SUBNET` variable.

Only backup itself:
```
make STEP=prepare_inventory migrate-subnet
make STEP=filter_inventory migrate-subnet
make STEP=shutdown_instances migrate-subnet
make STEP=backup_instances migrate-subnet
```

Backup as part of the example above - "Move VMs across regions (recreate subnet)".
```
# standard
make STEP=prepare_inventory migrate-subnet
make STEP=filter_inventory migrate-subnet
make STEP=shutdown_instances migrate-subnet
make STEP=create_machine_images migrate-subnet
# back up instances - move them to the backup subnet
make STEP=backup_instances migrate-subnet
make STEP=delete_instances migrate-subnet
# remove reserved static ips for this subnetwork
make STEP=release_ip_for_subnet migrate-subnet
# remove and recreate subnet in the same VPC but in the target region
make STEP=clone_subnet migrate-subnet
# recreate instances with the same IP in the recreated subnet
make STEP=create_instances migrate-subnet
```

If anything went wrong - rollback:
```
make STEP=prepare_rollback migrate-subnet
make STEP=rollback_instances migrate-subnet
# optionally start the instances
make STEP=start_instances INPUT_CSV=rollback.csv migrate-subnet
```

If everything went well - delete backed up instances (this does NOT delete the backup subnet):
```
make STEP=delete_instances INPUT_CSV=rollback.csv migrate-subnet
```
