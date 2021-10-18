# Copyright 2021 Google LLC. This software is provided as-is,
# without warranty or representation for any use or purpose.
# Your use of it is subject to your agreement with Google.

PROJECT=delivery-center-poc
MACHINE_IMAGE_REGION=us-central1

INPUT_CSV=export.csv

# SOURCE_SUBNET=projects/pso-suchit/regions/us-west1/subnetworks/sub-01
# SUBNET_NAME=sub-01 # The subnet to be deleted and moved
# SOURCE_ZONE=us-west1-b
# SOUCE_ZONE_2=us-west1-a
# SOURCE_REGION=us-west1

# TARGET_REGION=us-west1
# TARGET_SUBNET=projects/pso-suchit/regions/us-west1/subnetworks/sub-02
# TARGET_NETWORK=projects/pso-suchit/global/networks/vpc1
# TARGET_ZONE=us-west1-c


SOURCE_SUBNET=projects/delivery-center-poc/regions/us-central1/subnetworks/default
SUBNET_NAME=default # The subnet to be deleted and moved
SOURCE_ZONE=us-central1-a
SOURCE_ZONE_3=us-central1-b
SOURCE_REGION=us-central1

TARGET_REGION=us-west1
TARGET_SUBNET=projects/delivery-center-poc/regions/us-west1/subnetworks/sub-01
TARGET_NETWORK=projects/delivery-center-poc/global/networks/vpc1


STEP=prepare_inventory 
#  The steps can be any of prepare_inventory | filter_inventory | 
#  shutdown_instances | create_machine_images | delete_instances | release_ip | 
#  release_ip_for_subnet | 
#  clone_subnet | create_instances | create_instances_without_ip


clean-pyc:
	find . -name '*.pyc' -exec rm --force {} +
	find . -name '*.pyo' -exec rm --force {} +
	name '*~' -exec rm --force  {} 

clean-build:
	rm --force --recursive build/
	rm --force --recursive dist/
	rm --force --recursive *.egg-info

install-tools:
	pip3 install yapf
	pip3 install pylint

install-requirements:
	pip3 install -r requirements.txt

install:
	pip3 install -e . 

format:
	find . -type f -name "*.py" | xargs yapf -i -r 

lint:
	find . -type f -name "*.py" | xargs pylint 

migrate-subnet:
	python3 -m migrator.subnet_region_migrator --step=$(STEP) --source_zone=$(SOURCE_ZONE) --source_zone_2=$(SOUCE_ZONE_2) --source_zone_3=$(SOURCE_ZONE_3) --source_subnet=$(SOURCE_SUBNET) --project=$(PROJECT) --input_csv=$(INPUT_CSV) --target_subnet=$(TARGET_SUBNET) --machine_image_region=$(MACHINE_IMAGE_REGION) --subnet_name=$(SUBNET_NAME) --source_region=$(SOURCE_REGION) --target_region=$(TARGET_REGION)

#  make SOURCE_ZONE=us-west1-a SOURCE_SUBNET=projects/delivery-center-poc/regions/us-west1/subnetworks/sub-03 TARGET_SUBNET=projects/delivery-center-poc/regions/us-central1/subnetworks/sub-01 TARGET_ZONE=us-central1-a export-subnet