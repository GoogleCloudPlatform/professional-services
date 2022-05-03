# Running a GKE application on spot nodes with on-demand nodes as fallback
Spot VMs are unused virtual machines offered for a significant discount which makes them great for cost saving. However, spot VMs come with a catch: they can be shut down and taken away from your project at any time. Sometimes, they can even be completely unavailable (think Black Friday). The same applies to preemptible VMs. They behave similarly to spot VMs, but only have a runtime of 24h.

What if you have a stateless Kubernetes application with high availability requirements? In that case, the application can deal with nodes breaking away, but the high availability requirement would theoretically rule out using spot nodes. This would lead to the application having to run on “regular” on-demand machines, resulting in much higher costs.

The solution is simple: running the application primarily on spot-nodes, using an on-demand node pool as a fallback solution. In the rare case there are no spot VMs available of the machine type your application requires, the application can use the fallback node pool and run on on-demand instances.

## Example for creating an on-demand backup node pool

This is a Terraform example to provision an on-demand node pool as backup, in case there are no spot instances available.

## How to run this example

Before running this example, make sure to export your project ID as Terraform variable:
`export TF_VAR_project_id=[YOUR_GCP_PROJECT_ID]`

Authenticate against GCP, e.g. with `gcloud auth application-default-login --no-launch-browser` and make sure the account / service account used has the required roles.

Then preview and apply all changes with `terraform plan` and `terraform apply`.

## How to simulate spot instances being unavailable
To simulate spot VMs being unavailable and forcing the application to run on the fallback pool, first disable autoscaling and then scale the spot node pool down to 0 instances.

Disable autoscaling for the spot node pool:
`gcloud container clusters update "${TF_VAR_project_id}-gke" --no-enable-autoscaling --node-pool=spot-node-pool --zone=europe-west1-b`

Scale the spot-node-pool to 0:
`gcloud container clusters resize "${TF_VAR_project_id}-gke" --node-pool=spot-node-pool --num-nodes=0 --zone=europe-west1-b`

Now simulate spot VMs being available again by enabling autoscaling again:
`gcloud container clusters update "${TF_VAR_project_id}-gke" --enable-autoscaling --node-pool=spot-node-pool  --min-nodes=1 --max-nodes=3 --zone=europe-west1-b`

Wait for the drain-job to drain the on-demand nodes and watch your pods being scheduled back to the spot nodes. The drain-job is configured to run every 15 minutes, so this might take a while.