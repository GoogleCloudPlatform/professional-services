# Terraform will generate this file when the resources are created
include terraform-vars.mk

TEST_SSN_PATH := scripts/socials.txt
# NOTE: Firestore is only available in certain regions. See `gcloud app regions list`
FIRESTORE_REGION := us-west2

run_local:
	pip install -r requirements.txt
	python hashpipeline.py \
		--input inputs/small-input.txt \
		--project_id $(PROJECT) \
		--secret_name $(SECRET) \
		--collection_name $(COLLECTION) \
		--salt $(SALT) \
		--topic $(TOPIC)

deploy:
	python hashpipeline.py \
		--requirements_file requirements.txt \
		--region $(REGION) \
		--runner DataflowRunner \
		--project $(PROJECT) \
		--temp_location gs://$(BUCKET)/tmp/ \
		--staging_location gs://$(BUCKET)/stg/ \
		--template_location gs://$(BUCKET)/Template/hashpipeline


create_key:
	bash scripts/create-and-upload-key.sh $(PROJECT)

seed_firestore:
	gcloud alpha firestore databases create --project $(PROJECT) --region $(FIRESTORE_REGION)
	python scripts/seed-firestore.py $(PROJECT) $(SALT)

# Generates test input files for use in Dataflow and local Beam
generate_input_files:
	python scripts/generate-input-file.py $(TEST_SSN_PATH) inputs/large-input.txt 10000
	python scripts/generate-input-file.py $(TEST_SSN_PATH) inputs/small-input.txt 50

.PHONY: run run_local seed_firestore create_key
