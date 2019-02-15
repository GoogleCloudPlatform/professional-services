# Deploying Redis Cluster on GKE

This is a sample K8s configuration files to deploy a Redis Cluster on GKE.

## How to use

1. Provision a GKE cluster.

```
$ gcloud container clusters create redis-cluster --num-nodes 6 --machine-type n1-standard-8 --image-type COS --disk-type pd-standard --disk-size 100 --enable-ip-alias --create-subnetwork name=redis-subnet
```

Please specify your own project ID or prefered zone if you asked.

2. Clone an example git repository.
```
$ git clone https://github.com/GoogleCloudPlatform/professional-services.git
$ cd professional-services/examples/redis-cluster-gke
```

3. Create configmaps.
```
$ kubectl create -f configmaps/
```

4. Deploy Redis pods.
```
$ kubectl create -f redis-cache.yaml
```

Please wait until it is completed.

5. Prepare a list of Redis cache nodes.
```
$ kubectl get pods -l app=redis,redis-type=cache -o wide | tail -n +2 | awk '{printf "%s:%s ",$6,"6379"}' > redis-nodes.txt
$ kubectl create configmap redis-nodes --from-file=redis-nodes.txt
```

6. Submit a job to configure Redis cluster.
```
$ kubectl create -f redis-create-cluster.yaml
```

7. Confirm the job “redis-create-cluster-xxxxx” is in Completed status.
```
$ kubectl get po
NAME                           READY   STATUS      RESTARTS   AGE
redis-cache-55dfdcb84c-4tzh4   1/1     Running     0          5m
redis-cache-55dfdcb84c-79kkn   1/1     Running     0          5m
redis-cache-55dfdcb84c-98gn9   1/1     Running     0          5m
redis-cache-55dfdcb84c-t4gc6   1/1     Running     0          5m
redis-cache-55dfdcb84c-ttg85   1/1     Running     0          5m
redis-cache-55dfdcb84c-xdbz8   1/1     Running     0          5m
redis-create-cluster-cpjsp     0/1     Completed   0          3m
```
