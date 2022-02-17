#!/usr/bin/env bash
# Copyright 2021 Google Inc.
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#     http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.


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
