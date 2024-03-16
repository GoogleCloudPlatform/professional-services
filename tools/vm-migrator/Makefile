# Copyright 2021 Google LLC. This software is provided as-is,
# without warranty or representation for any use or purpose.
# Your use of it is subject to your agreement with Google.

MIGRATION_MAP=migration_map.json

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
	python3 -m migrator.subnet_region_migrator --step=$(STEP) --migration_json=$(MIGRATION_MAP)
