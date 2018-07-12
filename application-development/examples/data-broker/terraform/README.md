# Terraform Deployer for Aurinko
## Setup
In the terraform.tfvars file, edit the following variables.
```terminal
# The prefix for the project name that Terraform will create.
project_name = ""
# The billing account ID
billing_account = ""
# The oranization ID in Google Cloud
org_id = ""
# The name of the data set that Terraform will create
dataset = "aurinko"
# The name of the BigQuery table that Terraform will create
table = "aurinko"
```
### Environment Variables
Set the path to Terraform as an environment variable in your console.
```terminal
export PATH_TO_TERRAFORM=...
```
## Deploy
Create a bucket {MY_BUCKET} using gcloud or the GCP console
Initialize the Terraform environment.
```terminal
mvn resources:resources -Dtf-bucket-name='{MY_BUCKET}'
```
Run Terraform.
```terminal
mvn exec:exec -DTF_HOME=$PATH_TO_TERRAFORM -DTF_STAGE=init

mvn exec:exec -DTF_HOME=$PATH_TO_TERRAFORM -DTF_STAGE=plan

mvn exec:exec -DTF_HOME=$PATH_TO_TERRAFORM -DTF_STAGE=apply

```
**NOTE:** You may encounter an error during execution.  This happens.  If you get an error, run the following in the terminal.
```terminal
mvn exec:exec -DTF_HOME=$PATH_TO_TERRAFORM -DTF_STAGE=apply
```
## Service Account Key - PubSub Publisher
A service account key is created and downloaded to **terraform/target/classes/pubslisher-key.json**.