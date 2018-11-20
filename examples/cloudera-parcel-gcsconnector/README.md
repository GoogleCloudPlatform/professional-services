# Cloudera parcel installation

Aim of this repository/document is to create cloudera parcel with GCS connector jar and deploy on a Cloudera managed cluster.

# Getting Started

```sh
$ #git clone project_path
$ gcloud source repos clone gcs-connector-parcel --project=project_name
```
# Prerequisites
1. Download create_parcel.sh file from here(add link) [* if not cloned already]
2. [Optional] For on premise clusters, get the service account .json from your GCP account.


>Login and navigate to the google cloud console home page.
>Click on the menu on top left corner and select “APIs and services” > credentials.
>Choose service account json key and download the key in .json format.

# Installing
Once you have the required files run the script in below format.
```
$ ./create_parcel.sh -f parcel_name -v version -o operating_system -d 
```

Where,
-f is for parcel_name : is name of the parcel in a single string format without any spaces or special characters.

-v is for version : is the version of the parcel in the format x.x.x (ex: 1.0.0)

-o is for operating_system : is the name of the operating system to be chosen from this list (rhel5, rhel6, rhel7, suse11, ubuntu10, ubuntu12, ubuntu14, debian6, debian7)

-d is to be used if you want to deploy the parcel to the cloudera manager parcel repo folder, this flag is optional and if not provided then the parcel file will be created in the same directory where create_parcel.sh is script run.

Example
------
For the name of parcel as “gcsconnector”, version as “1.0.0”, and os type rhel6, run the below command.
```
$ ./create_parcel.sh -f pcscon -v 1.0.0 -o el6 -d
```

# Deployment
Once the script runs successfully go the Cloudera Manager home page
Click the **Hosts** > **Parcels** > **Check parcels**
Once the new parcel populates in the list of parcels.
Click **Distribute** > **Activate parcel**
This will distribute and activate the pracel on all Cloudera managed hosts.
Once activated successfully, **restart** all the stale services.

Check below path for logs:
/var/log/build_script.log


# Using services with GCS connector

# HDFS service
From the Cloudera Manager console go to **HDFS service** > **configurations** > **core-site.xml** 

Add the following properties in the Cluster-wide Advanced Configuration Snippet (Safety Valve) for **core-site.xml** 

**google.cloud.auth.service.account.enable** : true


**google.cloud.auth.service.account.json.keyfile** : {full path to JSON keyfile downloaded for service account}


Example : 
/opt/cloudera/parcels/gcsconnector/lib/hadoop/lib/key.json


**fs.gs.project.ids** : {GCP project ID}


**fs.gs.impl** : com.google.cloud.hadoop.fs.gcs.GoogleHadoopFileSystem

![alt text](professional-services/examples/cloudera-parcel-gcsconnector/Screen Shot 2018-10-04 at 9.56.59 PM.png)


Save configurations > Restart required services.

# Validate HDFS service
Export Java and hadoop classpath pointing to the gcsconnector jar.
```
$ export JAVA_HOME=/usr/lib/jvm/jre-1.8.0-openjdk.x86_64/
$ export HADOOP_CLASSPATH=$HADOOP_CLASSPATH:/opt/cloudera/parcels/gcsconnector-1.0.0/lib/hadoop/lib/gcs-connector-latest-hadoop2.jar
```

Run hdfs ls command to validate settings:
```
hdfs dfs -ls gs://bucket_name
```

# Spark Service
From the Cloudera Manager console go to **Spark** > **configurations** > Spark Service Advanced Configuration Snippet (Safety Valve) for spark-conf/spark-env.sh

Add below configuration according to the gcs connector jar path.

**SPARK_DIST_CLASSPATH**=$SPARK_DIST_CLASSPATH:/opt/cloudera/parcels/gcsconnector/lib/hadoop/lib/gcs-connector-latest-hadoop2.jar

![alt text](professional-services/examples/cloudera-parcel-gcsconnector/Screen Shot 2018-10-05 at 12.04.51 AM.png)

Validate spark connection with GCS
Connect to spark shell

```
$ spark-shell
```
Reading file stored on cloud storage. Provide the gs:// path to a json file stored in google cloud storage.
```
val src=sqlContext.read.json("gs://bucket-name/some_sample.json")
```

![alt text](professional-services/examples/cloudera-parcel-gcsconnector/Screen Shot 2018-10-05 at 10.21.03 PM.png)

# Hive Service
From the Cloudera Manager console go to **Hive Service** > **configuration** > **Hive Auxiliary JARs Directory** > 

/opt/cloudera/parcels/gcsconnector/lib/hadoop/lib/

(provide path to gcs-connector.jar file)

![alt text](professional-services/examples/cloudera-parcel-gcsconnector/Screen Shot 2018-10-05 at 5.38.44 PM.png)


Validate if jar is being accepted:

Navigate to beeline and connect to HiveServer2.

![alt text](professional-services/examples/cloudera-parcel-gcsconnector/Screen Shot 2018-10-05 at 8.29.55 PM.png)

