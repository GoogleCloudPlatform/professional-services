You can serve your TensorFlow models on Google Kubernetes Engine with
[TensorFlow Serving](https://www.tensorflow.org/tfx/guide/serving). This
example illustrates how to automate deployment of your trained models to GKE.
In production setup, it's also useful to load test your models to tune
TensorFlow Serving configuration and your whole setup, as well as to make sure
your service can handle the required throughput.
# Prerequisites
## Preparing a model
First of all, we need to train a model. You are welcome to experiment with your
own model or you might train an example based on this
[tutorial](https://www.tensorflow.org/tutorials/structured_data/feature_columns).  

```
cd tensorflow
python create_model.py
```
would create
## Creating GKE clusters for load testing and serving
Now we need to deploy our model. We're going to serve our model with Tensorflow Serving
launched in a docker container on a GKE cluster. Our _Dockerfile_ looks pretty simple:
```
FROM tensorflow/serving:latest

ADD batching_parameters.txt /benchmark/batching_parameters.txt
ADD models.config /benchmark/models.config

ADD saved_model_regression /models/regression
```
We only add model(s) binaries and a few configuration files. In a `models.config` we define
one (or many models) to be launched:
```
model_config_list {
  config {
    name: 'regression'
    base_path: '/models/regression/'
    model_platform: "tensorflow"
  }
}

```
We also need to create a GKE cluster and deploy a _tensorflow-app_ service there, that would
expose expose 8500 and 8501 ports (both for http and grpc requests) under a load balancer. 
```
python experiment.py
```
would create a _kubernetes.yaml_ file with default serving parameters.

For load testing we use a [locust](https://locust.io/) framework. We've implemented a _RegressionUser_
inheriting from _locust.HttpUser_ and configured locust to work in a distributed mode.

Now we need to create two GKE clusters . We're doing this to emulate cross-cluster network latency
as well as being able to experiment with different hardware for TensorFlow. All our deployment are
deployed with Cloud Build, and you can use a bash script to run e2e infrastructure creation.
```
export TENSORFLOW_MACHINE_TYPE=e2-highcpu-8
export LOCUST_MACHINE_TYPE=e2-highcpu-32
export CLUSTER_ZONE=<GCP_ZONE>
export GCP_PROJECT=<YOUR_PROJECT>
./create-cluster.sh
```

## Running a load test
After a cluster has been created, you need to forward a port to localhost:
```
gcloud container clusters get-credentials ${LOCUST_CLUSTER_NAME} --zone ${CLUSTER_ZONE}  --project=${GCP_PROJECT}
export LOCUST_CONTEXT="gke_${GCP_PROJECT}_${CLUSTER_ZONE}_loadtest-locust-${LOCUST_MACHINE_TYPE}"
kubectl config use-context ${LOCUST_CONTEXT}
kubectl port-forward svc/locust-master 8089:8089
```
Now you can access the locust UI at _localhost:8089_ and initiate a load test of your model.
We've observed the following results for the example model - 8ms @p50 and 11 @p99 at 300 queries per
second, and 13ms @p50 and 47ms @p99 at 3900 queries per second.

## Experimenting with addition serving parameters
Try to use a different hardware for Tensorflow Serving - e.g., recreate a GKE cluster using
`n2-highcpu-8` machines. We've observed a significant increase in tail
latency and throughput we could handle (with the same amount of nodes). 3ms @p50 and 5ms @p99 at
300 queries per second, and 15ms @p50 and 46ms @p90 at 15000 queries per second.

Another way to experiment with is to try out different [batching](https://www.tensorflow.org/tfx/serving/serving_config#batching_configuration)
parameters (you might look at the batching tuning 
[guide](https://github.com/tensorflow/serving/blob/master/tensorflow_serving/batching/README.md#performance-tuning))
as well as other TensorFlow Serving parameters defined
[here](https://github.com/tensorflow/serving/blob/master/tensorflow_serving/model_servers/main.cc#L59).

One of the possible configuration might be this one:
```
python experiment.py --enable_batching \
--batching_parameters_file=/benchmark/batching_parameters.txt  \
 --max_batch_size=8000 --batch_timeout_micros=4  --num_batch_threads=4  \
 --tensorflow_inter_op_parallelism=4 --tensorflow_intra_op_parallelism=4
```
In this case, your _kubernetes.yaml_ would have the following lines:
```
spec:
  replicas: 3
  selector:
    matchLabels:
      app: tensorflow-app
  template:
    metadata:
      labels:
        app: tensorflow-app
    spec:
      containers:
      - name: tensorflow-app
        image: gcr.io/mogr-test-277422/tensorflow-app:latest
        env:
        - name: MODEL_NAME
          value: regression
        ports:
        - containerPort: 8500
        - containerPort: 8501
        args: ["--model_config_file=/benchmark/models.config", "--tensorflow_intra_op_parallelism=4",
               "--tensorflow_inter_op_parallelism=4",
               "--batching_parameters_file=/benchmark/batching_parameters.txt", "--enable_batching"]
```
And the _batching_parameters.txt_ would look like this:
```
max_batch_size { value: 8000 }
batch_timeout_micros { value: 4 }
max_enqueued_batches { value: 100 }
num_batch_threads { value: 4 }
```
With this configuration, we would achieve much better performance (both higher throughput and lower
latency).
