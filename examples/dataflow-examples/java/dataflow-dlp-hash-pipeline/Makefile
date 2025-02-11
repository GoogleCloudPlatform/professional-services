# Terraform will generate this file when the resources are created
include terraform-vars.mk

TEST_SSN_PATH := scripts/socials.txt
# NOTE: Firestore is only available in certain regions. See `gcloud app regions list`
FIRESTORE_REGION := us-west2
TEMPLATE_IMAGE := gcr.io/$(PROJECT)/hashpipeline:latest
TEMPLATE_PATH := gs://$(BUCKET)/Template/hashpipeline

test:
	mvn test

run_local:
	mvn compile exec:java -e \
	  -Dexec.mainClass=com.google.cloud.pso.hashpipeline.Hashpipeline \
	  -Dexec.cleanupDaemonThreads=false \
	  -Dexec.args="\
      --project=$(PROJECT) \
      --runner=DirectRunner \
      --inputSubscription=$(INPUT_SUB) \
      --outputTopic=$(OUTPUT_TOPIC) \
      --firestoreProject=$(PROJECT) \
      --secretName=$(SECRET) \
      --collection=$(COLLECTION) \
      --salt=$(SALT)"

# Build using the standard template mechanism where parameters are hard-coded
# into the graph and cannot be changed between executions.
build:
	mvn compile exec:java \
      -Dexec.mainClass=com.google.cloud.pso.hashpipeline.Hashpipeline \
      -Dexec.cleanupDaemonThreads=false \
      -Dexec.args="\
        --project=$(PROJECT) \
        --region=$(REGION) \
        --runner=DataflowRunner \
        --inputSubscription=$(INPUT_SUB) \
        --outputTopic=$(OUTPUT_TOPIC) \
        --firestoreProject=$(PROJECT) \
        --secretName=$(SECRET) \
        --collection=$(COLLECTION) \
        --salt=$(SALT) \
        --stagingLocation=gs://$(BUCKET)/stg/ \
        --templateLocation=$(TEMPLATE_PATH)"

deploy: stop
	gcloud dataflow jobs run "hashpipeline-$$(date +%Y%m%d-%H%M%S)" \
		--project $(PROJECT) \
		--region $(REGION) \
		--staging-location gs://$(BUCKET)/stg/ \
		--service-account-email $(SERVICE_ACCOUNT) \
		--gcs-location $(TEMPLATE_PATH) \
		--num-workers 2
stop:
	for id in $$(gcloud beta dataflow jobs list --status active \
	--region $(REGION) --filter hashpipeline --project $(PROJECT) --format json | jq -r '.[]|.id'); do\
		gcloud beta dataflow jobs cancel $$id --region $(REGION);\
	done
	sleep 5

create_key:
	python scripts/hasher.py create-key --secret $(SECRET)

subscribe:
	python scripts/poller.py --subscription $(OUTPUT_SUB)

seed_firestore:
	python scripts/generate-test-socials.py $(TEST_SSN_PATH)
	./scripts/hasher.py upload \
		--project $(PROJECT) \
		--secret $(SECRET) \
		--salt $(SALT) \
		--collection $(COLLECTION) \
		--infile $(TEST_SSN_PATH)

# Generates test input files for use in Dataflow and local Beam
generate_input_files:
	python scripts/generate-input-file.py $(TEST_SSN_PATH) inputs/large-input.txt 10000
	python scripts/generate-input-file.py $(TEST_SSN_PATH) inputs/small-input.txt 50
	python scripts/generate-input-file.py $(TEST_SSN_PATH) inputs/tiny-input.txt 5

pip:
	pip install -r scripts/requirements.txt


.PHONY: run build deploy run_local create_key test_seed_firestore test_generate_input_files test_pull pip
