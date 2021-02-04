
# Register Clusters with Anthos


## Create GKE clusters

For this tutorial we’ll create 2 GKE clusters called `dev` and `prod`.  The dev cluster will be used for the dev and test environments while the prod cluster will be used for the prod environment.

Create dev and prod clusters:

```
for i in "dev" "prod"; do
  gcloud container clusters create ${i} \
      --zone $ZONE \
      --labels environment=${i}
done
```



## Prerequisites before registering clusters

Give yourself the required roles/permissions to register a cluster:


```
gcloud projects add-iam-policy-binding $PROJECT_ID \
   --member user:$USER \
   --role=roles/gkehub.admin \
   --role=roles/iam.serviceAccountAdmin \
   --role=roles/iam.serviceAccountKeyAdmin \
   --role=roles/resourcemanager.projectIamAdmin
```



## Register your clusters 

In this tutorial, we’ll register the clusters using workload identity (**recommended way**). Another way to [register a cluster](https://cloud.google.com/anthos/multicluster-management/connect/registering-a-cluster#register_cluster) is by using a Google Cloud service account. 

Register the clusters using workload identity:


```
# Depending on your gcloud version, you may replace "gcloud beta" with 
# "gcloud alpha" or remove "beta" in your command.
for i in "dev" "prod"; do
   CLUSTER_URI=`gcloud container clusters list --uri | grep ${i}`
   gcloud beta container hub memberships register ${i} \
       --gke-uri=$CLUSTER_URI \
       --enable-workload-identity
done
```


[Verify](https://pantheon.corp.google.com/anthos/clusters?project=titodo-sandbox) your clusters have been registered.


Next: [Set up Anthos Config Management(ACM)](docs/3-set-up-anthos-config-management.md)