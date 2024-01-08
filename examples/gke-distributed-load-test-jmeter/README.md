# Distributed Load-Testing with Jmeter

## Build and Push jmeter-master docker File

```Dockerfile
FROM justb4/jmeter:latest

EXPOSE 60000
```

```bash
docker build --tag="<artifact_registry_address>/jmeter-master:latest" -f Dockerfile-master .
docker push <artifact_registry_address>/jmeter-master:latest
```

## Build and Push jmeter-slave docker File

```Dockerfile
FROM justb4/jmeter:latest

EXPOSE 1099 50000
  
ENTRYPOINT $JMETER_HOME/bin/jmeter-server \
-Dserver.rmi.ssl.disable=true \
-Dserver.rmi.localport=50000 \
-Dserver_port=1099
```

```bash
docker build --tag="<artifact_registry_address>/jmeter-master:latest" -f Dockerfile-master .
docker push <artifact_registry_address>/jmeter-master:latest
```

## Create Deployments

```bash
./jmeter_cluster_create.sh
```

## Copy Test plan to Jmeter Master

```bash
kubectl cp neo4j-bolt-request.jmx <servive_name>/<pod_nam>:/bin/
```

## Run the load-test

```bash
kubectl exec -it <master_pod_name> -- /bin/bash
cd bin
./jmeter -n -t neo4j-bolt-request.jmx -l neo4j-load-test-logs.jtl -R <jmeter-slave-pod-ip-1>,<jmeter-slave-pod-ip-2>
```