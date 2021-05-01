# GCP VM Migrator

This utility automates migrating Virtual Machine instances within GCP. You can migrate VM's from one zone to another zone/region within the same or different projects.

## Prerequisite

To be able to execute the utility, the following prerequisites are to be met:
1. Access to Code repository
3. Python3 environment
3. The service account with which you are running this script should be able to
    * Create/Delete/Shutdown GCE
    * Create/Delete VPC subnets
    * Create/Delete machine images
4. Ability to create files on the filesystem to store the inventory data

## Setup

1. Clone the code repository
2. cd in the code directoy
3. Optional if using a virtual environment: ```python3 -m venv env```
3. Optional if using a virtual environment: ```source venv/bin/activate```
3. run ```make install-requirements```
4. run ```make install-tools```

## Testing

1. run ```make install```
2. run ```make test```

## Configuration
The `Makefile` has different variables which are passed to the subnet_region_migratory.py these variables can be overridden from the command line 

```make VARIABLE=VALUE migrate-subnet```


| Variable      | Value                              |
| ------------- | ---------------------------------- |
| STEP | The name of the step to run |
| MACHINE_IMAGE_REGION | The region where you want to store your machine images e.g us-central1 |
| SOURCE_PROJECT | Project ID where the VMs to be migrated are located |
| SOURCE_SUBNET | The source subnetwork uri |
| SOURCE_ZONE | The zone in which the source subnet is present, this is used to fetch the inventory details |
| SOURCE_ZONE_2 | [Optional] The second zone in which the source subnet is present, this is used to fetch the inventory details |
| SOURCE_ZONE_3 | [Optional] The third zone in which the source subnet is present, this is used to fetch the inventory details |
| TARGET_PROJECT | [Optional] If different from the source project, the Project ID where the new subnet will exist |
| TARGET_PROJECT_SA | [Optional] Required if the target project is different than the source project. Used as Service Account on the target VMs. |
| TARGET_PROJECT_SA_SCOPES | [Optional] If the target project is different than the source project, scopes to assign to the Service Account on the VMs |
| TARGET_SUBNET | [Optional] Leave this argument empty if using `clone_subnet`. Otherwise, if different to `SOURCE_SUBNET`, specify an existing target subnetwork uri.  |
| SOURCE_CSV | [Optional] (by default `source.csv`) The filename used by `prepare_inventory` |
| FILTER_CSV | [Optional] (by default `filter.csv`) File that contains the instance names that will be included by `filter_inventory` |
| INPUT_CSV | [Optional] (by default `export.csv`) The filtered list of machines created by `filter_inventory` used as input for the migration. |
| LOG_LEVEL | [Optional] Debugging level |

## Supported Functionality

VM Migrator supports multiple functionality, each feature is triggered via step name which is passed as a variable to the the script. 

While we can move all the machines in a subnet to the destination subnet we have given flexibility to go with two approaches 

1. Bulk move approach, where in you export all the machines running in one zone and subnet to destination zone and subnet. Since we are moving all the machines we can drain the entire subnet, clone and recreate the subnet in the destination region.
    * This approach lets you keep the same IP ( Internal + Alias IPs ) of the source VM in the destination subnet
2. Individual machine move, in this approach you can move only some of the machines to the destination subnet. Since we are not draining the entire subnet the cloned machines created will have a different ip from the source machine.


| STEP      | Description                              |
| ------------- | ---------------------------------- |
| prepare_inventory          | This will dump the entire inventory in the specified subnet and zones in CSV format into the `SOURCE_CSV` (by default `source.csv`).|
| filter_inventory     | Executes `prepare_inventory` and copies `SOURCE_CSV` to `INPUT_CSV` (by default `export.csv`) only selecting machines whose instance names match any row in `FILTER_CSV` (by default `filter.csv`). |
| shutdown_instances | This will shutdown all the machines whose details are found in the `INPUT_CSV` file, this is particularly useful when you want to shutdown the instances before taking their machine image |
| start_instances | This will start all the machines whose details are found in the `INPUT_CSV` file, this is particularly useful when you want to rollback the shutdown step |
| create_machine_images | This will create the machine image of the instances which are specifed in the `INPUT_CSV` file | 
| delete_instances | This will delete the instances which are specifed in the `INPUT_CSV` file |
| release_ip | This will release all the internal static ip addresses of the instances which are specifed in the `INPUT_CSV` file |
| release_ip_for_subnet | This will release all the internal static ip addresses of the source subnet | 
| clone_subnet | This will delete and re create the subnet in the destination region with the same config as the source subnet, this is required when you want to drain the entire subnet and create it in the destination region. Keep in mind that subnets can't be deleted from VPCs with auto subnet mode. |
| set_machineimage_iampolicies | This will provide the target project service account with the right permissions to access the source project machine images |
| create_instances | This will create the instances from the machine images in the destination subnet/region, it requires the destination subnet to be in place ( if you are cloning the subnet it will automatically be created  ) |
| create_instances_without_ip | This is similar to the create_instances step jus that it will not preserve the source ips, this is useful in situation when you are moving some of the machine to the destination subenet which has a different CIDR range |

## Running the Utility

Run ```make STEP=<step name> migrate-subnet```

Once your setup is complete and prerequisites are met, you need to ensure the latest code is pulled from repository

## Zone Mapping

Based on the source zones indicated via variables, the respective target zones will be chosen by matching the source zone in the file `zone_mapping.py`.

## Sole Tenant

The file ```node_group_mapping.py``` has the mapping of source and destination node groups if you are moving machines which are running on sole tenants then the create_instances/create_instances_without_ip step will look for mapping of node groups and it finds the mapping it will use the specified node group in the destination subnet/region to the run the VM on automatically. 

## Shared VPC

In the case of migrating VMs in a Shared VPC, the source and target projects are the service projects where the VMs live. The host project is implicitly indicated in the uri of the source and target subnet.

## Upgrading Machine Types

In the process of migration you can optimize the machine types based on the usage you can do that by providing the source and destination machine type mappings in ```machine_type_mapping.py``` e.g `n1-standard-1`: `n1-standard-4` would upgrade all the machines running with `n1-standard-1` to `n1-standard-4`


## Rollback
In order to rollback the changes please change the parameters of the source file and interchange the source and destination parameters.
Please note that some steps like `crate_machine_image` would not be required to run as the machine images have already been created.

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
make STEP=set_machineimage_iampolicies migrate-subnet
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

Notes:
* This case is particularly interesting if VMs need to stay *in the same VPC*. Otherwise, the next example (move VMs to an existing subnet is a better fit).

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

This recipe is fully compatible with moving across projects. In this case, please specify the `TARGET_PROJECT*` variables additionally and execute `make STEP=set_machineimage_iampolicies migrate-subnet` before creating the instances as well.
