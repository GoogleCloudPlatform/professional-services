project_id="igalic-terraform-commander" // ***CHANGE THIS***
region="us-central1"
zone="us-central1-a"
bucket_name="gs://cryptorealtime-demo-staging" // ***CHANGE THIS*** make this unique
bucket_folder="/temp" // temporary folder
bigtable_instance_name="cryptorealtime"
bigtable_table_name="cryptorealtime"
bigtable_family_name="market" // Note: If you change this you will have to update the RunThePipeline.java file


