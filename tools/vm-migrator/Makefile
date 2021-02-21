# Copyright 2021 Google LLC. This software is provided as-is,
# without warranty or representation for any use or purpose.
# Your use of it is subject to your agreement with Google.

MACHINE_IMAGE_REGION=us-central1
SOURCE_CSV=source.csv # actual default value
INPUT_CSV=export.csv

SOURCE_PROJECT=delivery-center-poc
SOURCE_REGION=us-central1
SOURCE_SUBNETWORK=default
SOURCE_ZONE=us-central1-a
SOURCE_ZONE_2=
SOURCE_ZONE_3=us-central1-b

# in this example source and target project are the same
TARGET_PROJECT=
TARGET_REGION=us-west1
TARGET_SUBNETWORK=sub-01

# actual default values
EXPORT_CSV=export.csv
FILTER_CSV=filter.csv
LOG_LEVEL=INFO

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
	python3 -m migrator.subnet_region_migrator --step=$(STEP) \
		--machine_image_region=$(MACHINE_IMAGE_REGION) \
		--source_project=$(SOURCE_PROJECT) --source_region=$(SOURCE_REGION) \
		--source_subnetwork=$(SOURCE_SUBNETWORK) --source_zone=$(SOURCE_ZONE) \
		--source_zone_2=$(SOUCE_ZONE_2) --source_zone_3=$(SOURCE_ZONE_3) \
		--target_project=$(TARGET_PROJECT) --target_region=$(TARGET_REGION) \
		--target_subnetwork=$(TARGET_SUBNETWORK) --source_csv=$(SOURCE_CSV) \
		--export_csv=$(EXPORT_CSV) --filter_csv=$(FILTER_CSV) \
		--log_level=$(LOG_LEVEL)
