# Dataproc Edge Node

This repository provides scripts for creating Dataproc Edge Nodes in two steps.
Step 1 creates a Dataproc cluster, installs a configuration script, and captures a VM Image.
Step 2 launches a GCE VM Instance from the image created by Step 1.


## What is an Edge Node?

An Edge Node is a user-facing VM Instance configured to interact with a remote Dataproc cluster.

The relationship is similar to a reverse proxy placed in front of a web application.

A Dataproc Edge Node can be used as an environment to store data, scripts, code and notebooks.

Because an edge node is not an active member of the cluster and does not execute tasks or contain sensitive data, users can be granted SSH access and local privileges to the edge node with less risk than direct access the cluster.


## Security Warnings

Note that in the default dataproc configuration, any user on the edge node is able to submit jobs and read data on the dataproc cluster without authentication, so it's necessary to restrict access to the edge node.

Additional work would be required to configure an edge nodes to interact with a Dataproc cluster that has Kerberos authentication enabled. This would require modification of [2_launch-edgenode.sh](2_launch-edgenode.sh) to add a startup script that installs keytabs and configures Kerberos.

If you are operating a secure cluster, the cluster is kerberized, and firewall rules allow only a limited set of ports for your edge nodes to communicate with the master and worker nodes. Your security policy will require authorization and auditing of SSH access to edge nodes, master and worker nodes, which may require integration with Active Directory using a third party tool. Your users will need to store kerberos keytabs on edge nodes to interact with kerberized services. A detailed consideration all of these necessary is unfortunately outside the scope of this example.


## Additional Warning

Proper use of edge nodes requires advanced configuration and understanding of Hadoop and Dataproc. Edge nodes are completely unsupported and actively recommended against by the Dataproc engineering team because of the significant amount of work required to maintain and troubleshoot the complex issues that arise as a result of using edge nodes.

This repository is provided only to demonstrate the possible foundations of a solution. If you do not have a CI system in place to keep the edge nodes up to date, or if your users do not have a good understanding of configuration for YARN/Spark/Hive/Tez/Presto or whatever their chosen execution engine is, you will run into cryptic error messages and difficult to diagnose issues. This is far off the beaten path and you have now been warned. Proceed only if you are confident that you know better and are willing to put in the effort to overcome an infinite series of non-trivial challenges.


## Usage

### Image Creation

1. Modify [image_env](image_env) to configure variables used to create a template Dataproc cluster
2. Run `1_create-image.sh` to launch a template Dataproc cluster and capture an image

### Edge Node Launch

1. Modify [edgenode_env](edgenode_env) to configure variables used to create a Dataproc Edge
Node
2. Run `2_launch-edgenode.sh` to launch a GCE VM Instance from the edgenode image.


## Supported clients

* Spark Submit
* Spark Shell
* PySpark
* Hive
* Beeline
* HDFS
* YARN
* Hadoop


## Known Issues

* MapReduce applications have issues contacting the YARN Timeline Server when using the default Dataproc configuration. If you experience this issue, disable the YARN Timeline Server.
* Some configuration settings are calculated by Dataproc cluster size at cluster creation time, so if you use the values from a small single-node cluster your jobs may be under-sized by default. You will need to copy values from your actual Dataproc cluster in order to avoid underutilization.


## How it works

### Image Creation

1. User invokes [create-image.sh](create-image.sh)
2. Files in `util` directory are uploaded to GCS
3. A single-node Dataproc cluster is created with [edge-node-startup-script.sh](util/edge-node-startup-script.sh) as startup script
4. [setup_edge_node.sh](util/setup_edge_node.sh) waits for Dataproc startup script to complete
5. [google-edgenode-configure](util/google-edgenode-configure.service) systemd service is installed
6. Unnecessary services are disabled
7. Configuration templates are created for each file listed in [config-files](util/config-files)
8. Template node is shutdown for image capture
9. Image is captured with `gcloud compute images create`

### Edge Node Creation

1. User invokes [launch-edgenode.sh](launch-edgenode.sh)
2. Edge node VM Instance is created by `gcloud compute instances create` with metadata key `target-dataproc-cluster`
3. `google-edgenode-configure` systemd service invokes [configure.sh](util/configure.sh)
4. Configuration script reads `target-dataproc-cluster` metadata key and rewrites configuration files from templates


## Troubleshooting

### Python version mismatch between client and server

```
ERROR org.apache.spark.deploy.yarn.ApplicationMaster: User class threw exception: java.io.IOException: Cannot run program "/opt/conda/default/bin/python": error=2, No such file or directory
```

`spark-submit` may fail due to version mismatch even when `spark-shell` or `pyspark` run correctly.

Run `python --version` and `which python` to verify that python versions are identical.

Example mismatch scenario:
- Client: `Python 3.6.5 :: Anaconda, Inc.` `/opt/conda/default/bin/python`
- Server: `Python 2.7.13` `/usr/bin/python`

It may be a simple fix to match the python env on both machines after the client was created but it's suggested to select image with the same python package and same settings with the server during creation of the client.

As of March 2019, `1.3-deb9` image version uses Python 2.7 while `preview` uses Python 3.5.


## Testing

1. Find the Dataproc Server cluster name and the image version to be referenced in the automation script

2. Decide the network tag to be used for the Dataproc client VM and use that to set up the firewall rules for the following ports to be opened.
- Client to master connection: for example, Hive: 10000 (hive server),9083 (hive metastore), spark: 7077 (spark master port), 7078 (spark worker port)
- Spark web server: 18080 (spark master web ui port), - user terminal to master

3. Create Client Dataproc VM with the above instructions

4. Validate the success criterion have been met
- Test Hive CLI: User should be able to query tables stored on master Dataproc hive server
- Test Spark Shell ( `spark-shell` for scala and `pyspark` for python): Note that it might take a while to initiate the shell. The job submitted on client VM should be shown on master Dataproc spark history-server UI (http://<spark_host_ip>:18080) - but it may only be shown after `exit()` the shell.
- Test spark-submit: The job submitted on client VM should be shown on master Dataproc spark history-server UI (http://<spark_host_ip>:18080)


## License

[Apache License 2.0](LICENSE)


## Disclaimer

This is not an official Google project.
