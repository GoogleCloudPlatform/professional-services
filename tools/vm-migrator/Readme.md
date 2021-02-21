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
4. Ablity to create files on the filesytem to store the inventory data

## Setup

1. Clone the code repository
2. cd in the code directoy
3. run ```make install-requirements```
4. run ```make install-tools```

## Configuration
The `Makefile` has different variables which are passed to the subnet_region_migratory.py these variables can be overriden from the command line 

```make VARIABLE=VALUE migrate-subnet```


| Variable      | Value                              |
| ------------- | ---------------------------------- |
| STEP | The name of the step to run |
| MACHINE_IMAGE_REGION | The region where you want to store your machine images e.g us-central1 |
| SOURCE_PROJECT | Project ID where the current subnet is located |
| SOURCE_REGION | Region of the source subnetwork |
| SOURCE_SUBNETWORK | The source subnetwork name |
| SOURCE_ZONE | The zone in which the source subnet is present, this is used to fetch the inventory details |
| SOURCE_ZONE_2 | [Optional] The second zone in which the source subnet is present, this is used to fetch the inventory details |
| SOURCE_ZONE_3 | [Optional] The third zone in which the source subnet is present, this is used to fetch the inventory details |
| TARGET_PROJECT | [Optional] If different, the Project ID where the new subnet will exist |
| TARGET_REGION | [Optional] If different, the target region where machines will be migrated to |
| TARGET_SUBNETWORK | [Optional] Leave this argument empty if using `clone_subnet`. Otherwise, if different to `SOURCE_SUBNETWORK`, specify an existing target subnetwork.  |
| SOURCE_CSV | [Optional] (by default `source.csv`) The filename used by `prepare_inventory` |
| FILTER_CSV | [Optional] (by default `filter.csv`) File that contains the instance names that will be included by `filter_inventory` |
| INPUT_CSV | [Optional] (by default `export.csv`) The filtered list of machines created by `filter_inventory` used as input for the migration. |
| LOG_LEVEL | [Optional] Debugging level |

## Supported Functionality

VM Migrator supports multiple functionality, each feature is triggered via step name which is passed as a variable to the the script. 

While we can move all the machines in a subnet to the destination subnet we have given felixibility to go with two approaches 

1. Bulk move approach, where in you export all the machines running in one zone and subnet to destination zone and subnet. Since we are moving all the machines we can drain the entire subnet, clone and recreate the subnet in the destination region.
    * This approach lets you keep the same IP ( Intenal + Alias IPs ) of the source VM in the destination subnet
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
| clone_subnet | This will delete and re create the subnet in the destination region with the same config as the source subnet, this is required when you want to drain the entire subnet and create it in the destination region |
| create_instances | This will create the instances from the machine images in the destination region, it requires the destination subnet to be in place ( if you are cloning the subnet it will automatically be created  ) |
| create_instances_without_ip | This is similar to the create_instances step jus that it will not preserve the source ips, this is useful in situation when you are moving some of the machine to the destination subenet which has a different CIDR range |

## Running the Utility

Run ```make STEP=<step name> migrate-subnet```

Once your setup is complete and prerequisites are met, you need to ensure the latest code is pulled from repository


## Zone Mapping

Based on the source zones indicated via variables, the respective target zones will be chosen by matching the source zone in the file `zone_mapping.py`.

## Sole Tenant

The file ```node_group_mapping.py``` has the mapping of source and destination node groups if you are moving machines which are running on sole tenants then the create_instances/create_instances_without_ip step will look for mapping of node groups and it finds the mapping it will use the specified node group in the destination region to the run the VM on automatically. 

## Upgrading Machine Types

If you are planing to migrate machines to a different region and in the process of migration you want to optimize the machine types based on the usage you can do that on the fly by providing the source and destination machine type mappings in ```machine_type_mapping.py``` e.g `n1-standard-1`: `n1-standard-4` would upgrade all the machines running with `n1-standard-1` to `n1-standard-4`


## Rollback
In order to rollback the changes please change the parameters of the source file and interchange the source and destination parameters.
Please note that some steps like `crate_machine_image` would not be required to run as the machine images have already been created.
