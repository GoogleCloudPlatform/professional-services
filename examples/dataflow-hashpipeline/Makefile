# Terraform will generate this file when the resources are created
include terraform-vars.mk

TEST_SSN_PATH := test/socials.txt
# NOTE: Firestore is only available in certain regions. See `gcloud app regions list`
TOKEN := $$(gcloud auth print-access-token)
FIRESTORE_REGION := us-west2
TEMPLATE_IMAGE := gcr.io/$(PROJECT)/hashpipeline:latest
TEMPLATE_PATH := gs://$(BUCKET)/Template/hashpipeline
FLEX_TEMPLATE_PATH := gs://$(BUCKET)/Template/hashpipeline-flex.json

run_local:
	pip install -r requirements.txt
	pip install apache-beam[gcp]
	python hashpipeline.py \
		--runner DirectRunner \
		--input_subscription $(INPUT_SUB) \
		--output_topic $(OUTPUT_TOPIC) \
		--firestore_project $(PROJECT) \
		--secret_name $(SECRET) \
		--collection_name $(COLLECTION) \
		--salt $(SALT) 

# Build with Flex Templates (Beta) to build the pipeline as a container so we
# can pass in parameters at runtime instead of baking them into the template.
build:
	gcloud --project $(PROJECT) builds submit --tag $(TEMPLATE_IMAGE) .

deploy:
	gcloud beta dataflow flex-template build $(FLEX_TEMPLATE_PATH) \
			--image $(TEMPLATE_IMAGE) \
			--sdk-language "PYTHON" \
			--metadata-file "metadata.json"
	gcloud beta dataflow flex-template run "hashpipeline-$$(date +%Y%m%d-%H%M%S)" \
			--project $(PROJECT) \
			--region $(REGION) \
			--template-file-gcs-location $(FLEX_TEMPLATE_PATH) \
			--parameters "input_subscription=$(INPUT_SUB),output_topic=$(OUTPUT_TOPIC),service_account_email=$(SERVICE_ACCOUNT),firestore_project=$(PROJECT),secret_name=$(SECRET),collection_name=$(COLLECTION),salt=$(SALT),staging_location=gs://$(BUCKET)/stg/,temp_location=gs://$(BUCKET)/tmp/"


# Build using the standard template mechanism where parameters are hard-coded
# into the graph and cannot be changed between executions.
build_standard:
	python hashpipeline.py \
		--requirements_file requirements.txt \
		--input_subscription $(INPUT_SUB) \
		--output_topic $(OUTPUT_TOPIC) \
		--firestore_project $(PROJECT) \
		--secret_name $(SECRET) \
		--collection_name $(COLLECTION) \
		--salt $(SALT) \
		--region $(REGION) \
		--runner DataflowRunner \
		--project $(PROJECT) \
		--temp_location gs://$(BUCKET)/tmp/ \
		--staging_location gs://$(BUCKET)/stg/ \
		--template_location $(TEMPLATE_PATH)

deploy_standard:
	gcloud dataflow jobs run "hashpipeline-$$(date +%Y%m%d-%H%M%S)" \
		--project $(PROJECT) \
		--region $(REGION) \
		--staging-location gs://$(BUCKET)/stg/ \
		--service-account-email $(SERVICE_ACCOUNT) \
		--gcs-location $(TEMPLATE_PATH) \

create_key:
	./scripts/hasher.py create-key --secret $(SECRET)

test_pull:
	gcloud --project $(PROJECT) pubsub subscriptions pull $(OUTPUT_SUB) --auto-ack \
		--format json | jq -r '.[]|.message.data' | base64 --decode

test_seed_firestore:
	python test/generate-test-socials.py $(TEST_SSN_PATH)
	./scripts/hasher.py upload \
		--project $(PROJECT) \
		--secret $(SECRET) \
		--salt $(SALT) \
		--collection $(COLLECTION) \
		--infile $(TEST_SSN_PATH)

# Generates test input files for use in Dataflow and local Beam
test_generate_input_files:
	python test/generate-input-file.py $(TEST_SSN_PATH) inputs/large-input.txt 10000
	python test/generate-input-file.py $(TEST_SSN_PATH) inputs/small-input.txt 50
	python test/generate-input-file.py $(TEST_SSN_PATH) inputs/tiny-input.txt 5



.PHONY: run build deploy run_local create_key test_seed_firestore test_generate_input_files test_pull build_legacy deploy_legacy
