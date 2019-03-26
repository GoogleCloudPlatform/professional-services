# Dataproc Persistent History Server
This repo houses the example code for a blog post on using a persistent history
server to retain infomation about your Spark and Hadoop jobs that ran on short-lived
clusters.

![Architecture Diagram](img/persistent-history-arch.png)

## Directory structure

- `cluster_templates/`
  - `history_server.yaml`
  - `ephemeral_cluster.yaml` 
- `init_actions`
  - `disable_history_servers.sh`
- `workflow_templates`
  - `spark_mr_workflow_template.yaml`
- `terraform`
  - `variables.tf` 
  - `network.tf` 
  - `history-server.tf` 
  - `history-bucket.tf` 
  - `firewall.tf` 
  - `service-account.tf`

## Usage

### Terraform
To spin up the whole example you could simply edit the 
`terraform.tfvars` file to set the variables to the 
desired values and run the following commands.

Note, this assumes that you have an existing project.

```
cd terraform
terraform init
terraform apply
```

### Google Cloud SDK
1.  Replace `PROJECT` with your GCP project id in each file.
1.  Replace `HISTORY_BUCKET` with your GCS bucket for logs in each file.
1.  Replace `REGION` with your desired GCP Compute region.

```
cd workflow_templates
sed -i 's/PROJECT/your-gcp-project-id/g' *
sed -i 's/HISTORY_BUCKET/your-history-bucket/g' *
sed -i 's/REGION/us-central1/g' *
sed -i 's/ZONE/us-central1-f/g' *
sed -i 's/SUBNET/your-subnet-id/g' *

cd cluster_templates
sed -i 's/PROJECT/your-gcp-project-id/g' *
sed -i 's/HISTORY_BUCKET/your-history-bucket/g' *
sed -i 's/REGION/us-central1/g' *
sed -i 's/ZONE/us-central1-f/g' *
sed -i 's/SUBNET/your-subnet-id/g' *
```

Stage an empty file to create the spark-events path on GCS. 

```
touch .keep
gsutil cp .keep gs://your-history-bucket/spark-events/.keep
rm .keep
```

Create the history server.

```sh
gcloud beta dataproc clusters import \
  history-server \
  --source=cluster_templates/history-server.yaml \
  --region=us-central1
```

Create a cluster which you can manually submit jobs to and tear down.

```sh
gcloud beta dataproc clusters import \
ephemeral-cluster \
--source=cluster_templates/ephemeral-cluster.yaml \
--region=us-central1
```

### Running the Workflow Template
Import the workflow template to run an example spark and hadoop job
to verify your setup is working.

```sh
gcloud dataproc workflow-templates import spark-mr-example \
--source=workflow_templates/spark_mr_workflow_template.yaml
```

Trigger the workflow template to spin up a cluster,
run the example jobs and tear it down.

```sh
gcloud dataproc workflow-templates instantiate spark-mr-example
```

### Viewing the History UI
Go look at the UI by ssh tunneling to the history server.

```sh
gcloud compute ssh history-server-m \
 --project=jferriero-sandbox \
 --zone=us-central1-a \
 -- \
 -D 1080 -N

/usr/bin/google-chrome \
 --proxy-server="socks5://localhost:1080" \
 --user-data-dir="/tmp/history-server-m" \
 http://history-server-m:18080
```
