# Copyright 2021 Google LLC. This software is provided as-is,
# without warranty or representation for any use or purpose.
# Your use of it is subject to your agreement with Google.

MACHINE_IMAGE_REGION=europe-west3
SOURCE_CSV=source.csv # actual default value
INPUT_CSV=export.csv

SOURCE_PROJECT=my-service-project
SOURCE_SUBNET=projects/my-host-project/regions/europe-west3/subnetworks/source-subnet
SOURCE_ZONE=europe-west3-c
SOURCE_ZONE_2=
SOURCE_ZONE_3=


#TARGET_PROJECT=${SOURCE_PROJECT}
# use the default target service account
#TARGET_PROJECT_SA=
#TARGET_PROJECT_SA_SCOPES=https://www.googleapis.com/auth/cloud-platform
TARGET_SUBNET=projects/my-host-project/regions/us-central1/subnetworks/target-subnet
#BACKUP_SUBNET=projects/my-host-project/regions/us-central1/subnetworks/backup-subnet

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
	pip3 install pytest

install-requirements:
	pip3 install -r requirements.txt

install:
	pip3 install -e . 

.PHONY: test
test:
	pytest --import-mode=importlib

format:
	find . -type f -name "*.py" | xargs yapf -i -r 

lint:
	find . -type f -name "*.py" | xargs pylint 

migrate-subnet:
	python3 -m migrator.subnet_region_migrator --step=$(STEP) \
		--machine_image_region=$(MACHINE_IMAGE_REGION) \
		--source_project=$(SOURCE_PROJECT) --source_subnet=$(SOURCE_SUBNET) \
		--source_zone=$(SOURCE_ZONE) --source_zone_2=$(SOURCE_ZONE_2) \
		--source_zone_3=$(SOURCE_ZONE_3) --target_project=$(TARGET_PROJECT) \
		--target_project_sa=$(TARGET_PROJECT_SA) \
		--target_project_sa_scopes=$(TARGET_PROJECT_SA_SCOPES) \
		--target_subnet=$(TARGET_SUBNET) --source_csv=$(SOURCE_CSV) \
		--backup_subnet=$(BACKUP_SUBNET) \
		--filter_csv=$(FILTER_CSV) --input_csv=$(INPUT_CSV) \
		--log_level=$(LOG_LEVEL)
