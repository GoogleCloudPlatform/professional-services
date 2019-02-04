# CryptoRealTime

## An Google Cloud Dataflow/Cloud Bigtable Websockets example

CryptoRealTime is an Apache Beam example that reads from the Crypto Exchanges WebSocket API and saves the feed in Cloud Bigtable. Since it is a Beam code, it can use other runners for this. 
Since this is a streaming example using an unbounded source, it is currently not possible to run this pipeline locally.

## Is the visualization of real time data from BigTable covered in this tutorial?
This will be covered in our second part

![Alt Text](https://media.giphy.com/media/ZO7YyCY1KVLgTu7FUd/giphy.gif)

## Architecture 
![Alt Text](https://i.ibb.co/fQs6Nhv/Screen-Shot-2019-02-04-at-4-24-34-PM.png)

## Costs
This tutorial uses billable components of GCP, including:
- Dataflow
- Compute Engine
- Google Cloud Storage
- BigTable

We recommend to clean up the project after finishing this tutorial to avoid costs. Use the [Pricing Calculator](https://cloud.google.com/products/calculator/) to generate a cost estimate based on your projected usage.

## Project setup 
### Install the Google Cloud Platform SDK

  * Create a project
  * Enable Billing
  * Create a [Cloud Bigtable Instance](https://cloud.google.com/bigtable/docs/creating-instance)
  * Development Environment Setup
      * Install [Google Cloud SDK](https://cloud.google.com/sdk/)
      or `sudo apt-get install google-cloud-sdk-cbt` 
      * Install [Java 1.8](http://www.oracle.com/technetwork/java/javase/downloads/index.html) or higher.
      or `sudo apt-get install openjdk-8-jre -y`
      * Install [Apache Maven](https://maven.apache.org/)
      or `sudo apt-get install maven -y`

    
  * `gcloud components update`
  * `gcloud config set project <your-project-id>`
  * `gcloud config set project <your-zone-id>`

### Provision a Bigtable Instance

In order to provision a Cloud Bigtable instance you will first need to create a
Google Cloud Platform project. You can create a project using the
[Developer Console](https://cloud.google.com/console).

After you have created a project you can create a new [Cloud Bigtable Instance](https://cloud.google.com/bigtable/docs/creating-instance) by
clicking on the "Storage" -> "Cloud Bigtable" menu item and clicking on the
"New Instance" button.  After that, enter the instance name, ID, zone, and number
of nodes. Once you have entered those values, click the "Create" button to
provision the instance.

- Choose development / HDD / 1000 GB / specify random cluster ID / region / zone / 3 nodes 

Next, go to "APIs" and search for the Cloud Bigtable API and make sure the following APIs are
enabled:

* Cloud Bigtable API
* Cloud Bigtable Table Admin API
* Cloud Bigtable Cluster Admin API
* Cloud Dataflow API
* Google Compute Engine API

### Make a GCS Bucket

Make a GCS bucket that will be used by bdutil to store its output and to copy
files to the VMs.  There are two ways to make a GCS Bucket,

1. In the Cloud Console, select "Storage" > "Cloud Storage" > "Storage
   browser" and click on the "Add bucket" button. Type the name for your
   bucket and click "Create".  (Note - Names are a global resource, so make
   yours long and unique)
1. Use the gsutil tool's Make Bucket command:

    `$ gsutil mb -p <project ID> gs://<bucketName>`

### Create The Bigtable Table

1. Install CBT cmd tool [CBT Shell](https://cloud.google.com/bigtable/docs/cbt-overview)
   A summary of the instructions is:
   * Auth option A) Download a Service Account JSON Credential + Point the GOOGLE_APPLICATION_CREDENTIALS environment variable to that file
   * Auth option B) `gcloud auth application-default login`
2. Launch console shell ane execute cbt command (name )

    ` cbt -instance=<bigtable-instance> createtable <tablename> families=<familyname>`

3. Example: Create the table (here, table name is cryptorealtime, and column family is market)

    ` cbt -instance=<bigtable-instance> createtable cryptorealtime families=market`


### Build the Jar File


1. Build the entire repo from the outer directory before building this POM. 

In the root folder (cryptorealtime in this case) or where pom.xml file is located please run the following command:
   ```mvn clean install```
   
   Note: if you are having issues with this command try: `sudo apt-get install --reinstall ca-certificates`


Building it from the outer repo ensures that the parent POM is properly installed for the children POMs to reference.

Subsequent builds of only this project can be run from this directory:

    ```mvn clean package```

## Deploying

1. Run:

    `./run.sh <project-name> <bigtable-instance-name> <gs://tempbucketname/local> <bigtable-table-name> <bigtable-table-family-name>`

Example:
    ` ./run.sh cryptorealtime-demo cryptorealtime-bt gs://cryptorealtime-demo-staging/temp cryptorealtime market`

Ignore any java.lang.IllegalThreadStateException errors.

# Problems?
-bash: ./run.sh: Permission denied - give run.sh exec permission
`chmod a+x run.sh `


1. View the status of your Dataflow job in the Cloud Dataflow console

1. After a few minutes, from the shell,

    `cbt -instance=<bigtable-instance-name> read <bigtable-table-name>`

Should return many rows of crypto trades data that the frontend project will read for it's dashboard.



## Ideas To Add
Subnetworking configuration for invidiual workers for lower latency responses

## External libraries used to connnect to exchanges 
https://github.com/bitrich-info/xchange-stream


Copyright Google 2018
