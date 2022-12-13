## How to use it
### Requirements
- GCP Project created
- Terraform installed
- Service Account with the following permissions:
    - BigQuery Admin
    - Service Account User
    - Pub/Sub Admin
    - Storage Admin
    - Composer Admin

### Setup the environment
The following setup will create the necessary components used by the pipeline during execution.
1. Go to **infra-as-code/environment-setup**
```
cd infra-as-code/environment-setup
```
2. Set values for the following variables on input.tfvars.
```
project_id = ""
project_number = ""
region = ""
zone = ""
```
Set the bucket id on main.tf
```
bucket = ""
```
3. Execute the Terraform Code.
```
terraform init
terraform apply -var-file=input.tfvars
```
After executing, for the next stage save the email address for the service account **ccm-worker-sa@<project_id>.iam.gserviceaccount.com**

4. Create Service Transfer Services (Optional)

This asset requires usage of AWS, Azure to GCS transfer service, the code in **infra-as-code/storage-transfer-service** allows you to create these services. These are not necessary to be created with terraform but the scripts provided allows you to include these in the **environment-setup** dir.

### Setup the Pipeline scripts
1. Go to **infra-as-code/environment-deploy**
```
cd infra-as-code/environment-deploy
```
2. Set values for the following varibles on input.tfvars
```
project_id = ""
composer_instance_name = ""
service_account = "ccm-worker-sa@<project_id>.iam.gserviceaccount.com"
region = ""
zone = ""
```
Set the bucket id on main.tf
```
bucket = ""
```

## Setup Cloud Build
Create 2 triggers, one for Environment creation and the other for environment delete. Previous to this step the code should be in a git repository, adjust this according to the auth mechanism.

### Environment creation
1. Set Event as Pub/Sub Message
2. Set the Pub/Sub Topic ccm-composer-trigger
3. Select your Source repository
4. Select the Branch
5. In the configuration select Cloud Build and Repository for Location. Set /cloudbuild-create.yml

### Environment deletion
1. Set Event as Pub/Sub Message
2. Set the Pub/Sub Topic ccm-composer-trigger-delete
3. Select your Source repository
4. Select the Branch
5. In the configuration select Cloud Build and Repository for Location. Set /cloudbuild-delete.yml

