#!/bin/bash

# These variables should be set in landingzone.conf
export GCP_ORG_DOMAIN=''
export GCP_BILLING_ID=''
export GCP_PROJ_PREFIX=''
export FAST_CONFIG_DIR=''
#source ./landingzone.conf

# set variable for current logged in user
FAST_BU=$(gcloud config list --format 'value(core.account)')
export FAST_BU

# find and set your org id
gcloud organizations list --filter display_name:"$GCP_ORG_DOMAIN"
FAST_ORG_ID=$( gcloud organizations list --filter display_name:vertexai --format='value(name)' )
export FAST_ORG_ID

echo "Found GCP Org ID: $FAST_ORG_ID"

# set needed roles
export FAST_ROLES="roles/billing.admin roles/logging.admin \
  roles/iam.organizationRoleAdmin roles/resourcemanager.projectCreator"

echo "Adding roles..."
for role in $FAST_ROLES; do
  gcloud organizations add-iam-policy-binding "$FAST_ORG_ID" \
    --member user:"$FAST_BU" --role "$role"
done

echo "Setting up Billing..."

export FAST_BILLING_ACCOUNT_ID=$GCP_BILLING_ID
gcloud beta billing accounts add-iam-policy-binding "$FAST_BILLING_ACCOUNT_ID" \
  --member user:"$FAST_BU" --role roles/billing.admin

# TODO
# Create these groups in Workspace:
# gcp-billing-admins
# gcp-devops
# gcp-network-admins
# gcp-organization-admins
# gcp-security-admins
# devgroup1
# prodgroup1

# TODO
# Add $FAST_BU (i.e. current user logged in and running this) to the gcp-organization-admins@ Group

# TODO
# Use the variables here to create 00-bootstrap/terraform.tfvars
#

# Login as $FAST_BU user in gcloud and for application default
gcloud auth application-default login

#########
# Stage 0

cd 00-bootstrap || exit

#terraform init
#terraform plan -input=false -out bootstrap.tfplan
#terraform apply -var bootstrap_user=$(gcloud config list --format 'value(core.account)')

# Migrate state files
terraform output -json providers | jq -r '.["00-bootstrap"]'   > providers.tf
terraform init -migrate-state
# type yes

# Remove bootstrap user
terraform apply
cd ../ || exit

#########
# Stage 1
cd 01-resourcemanager || exit

# Link configuration files
ln -s ../fast-config/tfvars/globals.auto.tfvars.json .
ln -s ../fast-config/tfvars/00-bootstrap.auto.tfvars.json .
ln -s ../fast-config/providers/01-resman-providers.tf .


# IF not current...
#gcloud auth application-default login
terraform init
terraform apply

# Setup for next networking stage
terraform output -json providers | jq -r '.["02-networking"]' > ../02-networking-peering/providers.tf
terraform output -json providers | jq -r '.["02-security"]' > ../02-security/providers.tf

cd ../ || exit

#########
# Stage 2 - Networking
cd 02-networking || exit

# Don't need this, did the tf output ... above
# ln -s ../fast-config/providers/02-networking-providers.tf .

ln -s ../fast-config/tfvars/globals.auto.tfvars.json .
ln -s ../fast-config/tfvars/00-bootstrap.auto.tfvars.json .
ln -s ../fast-config/tfvars/01-resman.auto.tfvars.json .


# IF not current...
#gcloud auth application-default login
terraform init
terraform apply
cd ../ || exit

#########
# Stage 2 - Security
cd 02-security || exit

# Don't need this, did the tf output ... above
# ln -s ../fast-config/providers/02-networking-providers.tf .

ln -s ../fast-config/tfvars/00-bootstrap.auto.tfvars.json .
ln -s ../fast-config/tfvars/01-resman.auto.tfvars.json .
# also copy the tfvars file used for the bootstrap stage
cp ../00-bootstrap/terraform.tfvars .

# IF not current...
#gcloud auth application-default login
terraform init
terraform apply
cd ../ || exit

#########
# Stage 3.1 - Project Factory for Dev env
cd 03-project-factory/dev || exit


rm -f 00-bootstrap.auto.tfvars.json  01-resman.auto.tfvars.json  02-networking.auto.tfvars.json  03-project-factory-dev-providers.tf  globals.auto.tfvars.json 
ln -s ../../fast-config/tfvars/00-bootstrap.auto.tfvars.json .
ln -s ../../fast-config/tfvars/01-resman.auto.tfvars.json .
ln -s ../../fast-config/tfvars/02-networking.auto.tfvars.json .
ln -s ../../fast-config/providers/03-project-factory-dev-providers.tf .
ln -s ../../fast-config/tfvars/globals.auto.tfvars.json .

echo "Getting folder info for VertexAI projects..."
#DEV_FOLDER_ID=$(cat fast-config/tfvars/01-resman.auto.tfvars.json | jq '.folder_ids.dev')
#PROD_FOLDER_ID=$(cat fast-config/tfvars/01-resman.auto.tfvars.json | jq '.folder_ids.prod')
DEV_FOLDER_ID=$(jq '.folder_ids.dev' fast-config/tfvars/01-resman.auto.tfvars.json)
PROD_FOLDER_ID=$(jq '.folder_ids.prod' fast-config/tfvars/01-resman.auto.tfvars.json)
sed -i '' s^%DEV_FOLDER_ID%^"$DEV_FOLDER_ID"^g 03-project-factory/dev/data/projects/vertexai1.yaml
sed -i '' s^%PROD_FOLDER_ID%^"$PROD_FOLDER_ID"^g 03-project-factory/dev/data/projects/vertexai1.yaml


echo "Configuring $VERTEXAI_DEV_GROUP for VertexAI dev project..."
sed -i '' s^%VERTEXAI_DEV_GROUP%^"$VERTEXAI_DEV_GROUP"^g 03-project-factory/dev/data/projects/vertexai1.yaml
echo "Configuring $VERTEXAI_PROD_GROUP for VertexAI prod project..."
sed -i '' s^%VERTEXAI_PROD_GROUP%^"$VERTEXAI_PROD_GROUP"^g 03-project-factory/prod/data/projects/vertexai1.yaml

# IF not current...
#gcloud auth application-default login
terraform init
terraform apply
cd ../ || exit

#########
# Stage 4.1 - Project Factory for Prod env
cd 03-project-factory/prod || exit

rm -f 00-bootstrap.auto.tfvars.json  01-resman.auto.tfvars.json  02-networking.auto.tfvars.json  03-project-factory-prod-providers.tf  globals.auto.tfvars.json 
ln -s ../../fast-config/tfvars/00-bootstrap.auto.tfvars.json .
ln -s ../../fast-config/tfvars/01-resman.auto.tfvars.json .
ln -s ../../fast-config/tfvars/02-networking.auto.tfvars.json .
ln -s ../../fast-config/providers/03-project-factory-prod-providers.tf .
ln -s ../../fast-config/tfvars/globals.auto.tfvars.json .

echo "Getting folder info for VertexAI projects..."
DEV_FOLDER_ID=$(jq '.folder_ids.dev' fast-config/tfvars/01-resman.auto.tfvars.json)
PROD_FOLDER_ID=$(jq '.folder_ids.prod' fast-config/tfvars/01-resman.auto.tfvars.json)
sed -i '' s^%DEV_FOLDER_ID%^"$DEV_FOLDER_ID"^g 03-project-factory/dev/data/projects/vertexai1.yaml
sed -i '' s^%PROD_FOLDER_ID%^"$PROD_FOLDER_ID"^g 03-project-factory/dev/data/projects/vertexai1.yaml

echo "Configuring $VERTEXAI_DEV_GROUP for VertexAI dev project..."
sed -i '' s^%VERTEXAI_DEV_GROUP%^"$VERTEXAI_DEV_GROUP"^g 03-project-factory/dev/data/projects/vertexai1.yaml
echo "Configuring $VERTEXAI_PROD_GROUP for VertexAI prod project..."
sed -i '' s^%VERTEXAI_PROD_GROUP%^"$VERTEXAI_PROD_GROUP"^g 03-project-factory/prod/data/projects/vertexai1.yaml

# IF not current...
#gcloud auth application-default login
terraform init
terraform apply
cd ../ || exit

