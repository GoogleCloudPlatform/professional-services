# BigQuery Email Export

This solution enables users to export BigQuery results as a CSV and sends it as an email attachment to corresponding users.
It does the following functional steps:

# Set up
1. Create a BigQuery Dataset and set the default expiration time of the table 

      `bq --location=US mk -d --default_table_expiration 3600 bq_export_dataset`
      
2. Create a Google Cloud Storage bucket to host the exported CSV files from BigQuery
      
      `gsutil mb gs://bq_results/`
    
3. Generate SendGrid API key using SendGrid

# Deploying the pipeline

The delpoy.sh does the following:

Creates a service account with ServiceAccountTokenCreator, BQ Object Admin, roles

# Running the main script

The main.py scrip:

