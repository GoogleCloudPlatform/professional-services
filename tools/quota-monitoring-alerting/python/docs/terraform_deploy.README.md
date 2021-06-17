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

Credentials
```bash
gcloud auth application-default login
```

Enable Appengine service. NOTE: CloudScheduler requires AppEngine project.
```bash
gcloud services enable appengine.googleapis.com
```

Create Appengine app.
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
org            = "REPLACE_WITH_OG_ID"
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
TODO: This part is still WIP.

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
