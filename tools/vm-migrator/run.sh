#!/bin/bash
# Copyright 2020 Google LLC. This software is provided as-is,
# without warranty or representation for any use or purpose.
# Your use of it is subject to your agreement with Google.


# The steps can be any of prepare_inventory | shutdown_instances | create_machine_images | delete_instances | release_ip_for_subnet | clone_subnet | create_instances | create_instances_without_ip

make STEP=prepare_inventory migrate-subnet
make STEP=filter_inventory migrate-subnet
make STEP=shutdown_instances migrate-subnet
make STEP=create_machine_images migrate-subnet
make STEP=delete_instances migrate-subnet
make STEP=release_ip migrate-subnet
make STEP=release_ip_for_subnet migrate-subnet
make STEP=clone_subnet migrate-subnet
make STEP=create_instances migrate-subnet
