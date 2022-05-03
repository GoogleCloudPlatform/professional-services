# Running a GKE application on spot nodes with on-demand nodes as fallback
Spot VMs are unused virtual machines offered for a significant discount which makes them great for cost saving. However, spot VMs come with a catch: they can be shut down and taken away from your project at any time. Sometimes, they can even be completely unavailable (think Black Friday). The same applies to preemptible VMs. They behave similarly to spot VMs, but only have a runtime of 24h.

What if you have a stateless Kubernetes application with high availability requirements? In that case, the application can deal with nodes breaking away, but the high availability requirement would theoretically rule out using spot nodes. This would lead to the application having to run on “regular” on-demand machines, resulting in much higher costs.

The solution is simple: running the application primarily on spot-nodes, using an on-demand node pool as a fallback solution. In the rare case there are no spot VMs available of the machine type your application requires, the application can use the fallback node pool and run on on-demand instances.

## Example for creating an on-demand backup node pool

This is a Terraform example to provision an on-demand node pool as backup, in case there are no spot instances available.

This Terraform script creates a GKE cluster with a spot-node-pool and an on-demand-node-pool. A node [Taint](https://kubernetes.io/docs/concepts/scheduling-eviction/taint-and-toleration/) is configured for all nodes within the on-demand pool. 
Then a simple container is deployed to the cluster, with [NodeAffinity](https://kubernetes.io/docs/concepts/scheduling-eviction/assign-pod-node/) set to nodes having the label `cloud.google.com/gke-spot=true` assigned, and Tolerations set to avoid nodes with the Taint type=on-demand.
Configuring these preferences will result in the pods being scheduled to the spot nodes, if possible. 

To make sure pods get scheduled back to spot VMs automatically, a drain-job is deployed which [drains](https://kubernetes.io/docs/tasks/administer-cluster/safely-drain-node/) all on-demand nodes every 15 minutes.
The PodDisruptionBudget configured ensures that the application keeps running when being scheduled back.

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

## Things to keep in mind
Worst case scenario, it could happen that all spot VMs get removed from your project at the same time.

Your application only has 60s from receiving the SIGTERM signal until the node is being shut down. In those 60s, the pods running on spot VMs have to be shut down, a new node has to be spun up in the on-demand pool, and the pods have to be restarted on the new node. 
Especially spinning up a new node takes some time, which means your application might experience temporary performance issues in this scenario. To avoid that, consider having sufficient instances available on standby within the on-demand pool. Of course, this also increases your cost. 

This trade-off is something you have to consider in advance and test thoroughly, to find the perfect balance between spot and on-demand nodes for your application’s use case.

Another thing to keep in mind is to double the maximum available/allowed CPU requirement for your project. In case of scheduling the pods from the on-demand pool back to spot, double the amount of machines will be running temporarily.
