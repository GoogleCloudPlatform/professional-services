# Copyright 2018 Google LLC
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#     https://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.


# .PHONY: clean init plan apply # destroy
.PHONY: clean init plan apply # destroy

all: clean init plan apply

help:						## Show this help
	@fgrep -h "##" $(MAKEFILE_LIST) | fgrep -v fgrep | sed -e 's/\\$$//' | sed -e 's/##//'

clean:						## clean up from prior runs
	GOOGLE_PROJECT=$(gcloud config get-value project) 
	rm -r -f .terraform terraform.tf*

get:						## Get required components
	GOOGLE_PROJECT=$(gcloud config get-value project) 
	terraform get

init:						## init terraform modules
	./create-tfvars.sh
	gcloud services enable compute.googleapis.com
	gcloud services enable container.googleapis.com
	terraform init
plan:						## create the terraform plan
	./create-tfvars.sh
	terraform plan -var-file=terraform.tfvars -out=./terraform.tfstate

refresh:
	GOOGLE_PROJECT=$(gcloud config get-value project)
	./create-tfvars.sh
	terraform refresh -var-file=terraform.tfvars

apply:						## apply the formation
	GOOGLE_PROJECT=$(gcloud config get-value project) 
	# echo "yes" | terraform apply -var-file=terraform.tfvars
	terraform apply "./terraform.tfstate"

output:						## print the output
	GOOGLE_PROJECT=$(gcloud config get-value project)
	terraform output -json

destroy:					## destroy the infra
	GOOGLE_PROJECT=$(gcloud config get-value project) 
	terraform destroy -var-file=terraform.tfvars
