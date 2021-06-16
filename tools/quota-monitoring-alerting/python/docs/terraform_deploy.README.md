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
```bash
cd terraform; terraform init
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
cd ../
```

If this reports an error, wait a few seconds and try again.
NOTE: Need to check why Cloud Monitoring throws error initially.
```bash
python bootstrap.py
```

Set email address for recieving the notifications
```bash
export EMAIL_ADDRESS=<REPLACE_WITH_EMAIL_ADDRESS>
```

Replace email address info
```bash
sed 's/$EMAIL_ADDRESS/'"$EMAIL_ADDRESS"'/' \
  $PWD/templates/inputs/quota_email_notification.yaml > $PWD/templates/outputs/quota_email_notification.yaml
```

Create notification channel
```bash
export CHANNEL=$(gcloud alpha monitoring channels create --channel-content-from-file=templates/outputs/quota_email_notification.yaml --format=json | grep -Po 'projects.*(?=",)')
```

Replace with correct dashboard link
```bash
export DASHBOARD_LINK='https://datastudio.google.com/c/u/0/reporting/657f72d0-8625-42a5-8aa1-e5ee1d48a31c/page/IFhNC'
```

```bash
sed 's~$CHANNEL~'"$CHANNEL"'~g' $PWD/templates/inputs/quota_exceeded_threshold_report_policy.yaml | sed 's~$DASHBOARD_LINK~'"$DASHBOARD_LINK"'~g' > $PWD/templates/outputs/quota_exceeded_threshold_report_policy.yaml
```

Create alert policy
```bash
gcloud alpha monitoring policies create --policy-from-file=templates/outputs/quota_exceeded_threshold_report_policy.yaml
```
