## Terraform deployment steps

Create a directory
```bash
mkdir workspace; cd workspace
```

Clone code
```bash
git clone https://github.com/GoogleCloudPlatform/professional-services.git
```

```bash
cd professional-services/tools/quota-monitoring-alerting/python
```

Export ENV variables
```bash
export REGION=us-central1
```

---
Credentials

<<<<<<< HEAD
> Irrespective of user account or service account approach, make sure the permissions metioned in top level [README](..README.md#common-steps) are granted to the account.
=======
> Irrespective of user account or service account approach, make sure the permissions mentioned in top level [README](..README.md#common-steps) are granted to the account.
>>>>>>> upstream/main

* Using user credentials
```bash
gcloud auth application-default login
```

* Using service account credentials
  * Download the service account key and keep it in a safe location.
  * Execute the below commands by pointing them to the location of the key.
  * ```bash
    gcloud auth activate-service-account --key-file=[RELATIVE_PATH_TO_CREDENTIALS_FILE]
    ```
  * ```bash
    export GOOGLE_APPLICATION_CREDENTIALS=[ABSOLUTE_PATH_TO_CREDENTIALS_FILE]
    ```

---
<<<<<<< HEAD
Enable Appengine service. NOTE: CloudScheduler requires AppEngine project.
=======
Enable AppEngine service. NOTE: CloudScheduler requires an AppEngine project.
>>>>>>> upstream/main
```bash
gcloud services enable appengine.googleapis.com
```

<<<<<<< HEAD
Create Appengine app.
=======
Create AppEngine app.
>>>>>>> upstream/main
```bash
gcloud app create --region=${REGION//[0-9]/} 
```

---
Setup Common Infra.
```bash
cd terraform/common; terraform init
```

Update terraform.tfvars
```
vi terraform.tfvars
```

```
name           = "quota-export"
<<<<<<< HEAD
org            = "REPLACE_WITH_OG_ID"
=======
org            = "REPLACE_WITH_ORG_ID"
>>>>>>> upstream/main
project        = "REPLACE_WITH_PROJECT_ID"
project_number = "REPLACE_WITH_PROJECT_NUMBER"
region         = "us-central1"
```

```bash
terraform plan
```

```bash
terraform apply
```

---
Setup DataStudio Dashboard.
<<<<<<< HEAD
TODO: This part is still WIP.
=======

**TODO**: This part is still WIP.
>>>>>>> upstream/main

---
Bootstrap to create Metric Descriptor etc.
```bash
cd ../../
```

If this reports an error, wait a few seconds and try again.
NOTE: Need to check why Cloud Monitoring throws error initially.
```bash
python bootstrap.py
```

---
Setup Alerting
```bash
cd terraform/alerting; terraform init
```

Update terraform.tfvars
```
vi terraform.tfvars
```

```
project        = "REPLACE_WITH_PROJECT_ID"
email_address  = "REPLACE_WITH_EMAIL_ID"
dashboard_link = "REPLACE_WITH_DASHBOARD_LINK"
```

```bash
terraform plan
```

```bash
terraform apply
```

---
[Back to top level README](../README.md)
