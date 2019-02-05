project_id="igalic-terraform-commander" // ***CHANGE THIS***
bucket_name="gs://cryptorealtime-demo-staging" // ***CHANGE THIS*** make this unique
credsfile="/Users/igalic/.config/gcloud/igalic-terraform-commander-b14a681ac62c.json" // ***CHANGE THIS***

// OPTIONAL
region="us-central1"
zone="us-central1-a"
bucket_folder="/temp" // temporary folder
bigtable_instance_name="cryptorealtime"
bigtable_table_name="cryptorealtime"
bigtable_family_name="market" // Note: If you change this you will have to update the RunThePipeline.java file
