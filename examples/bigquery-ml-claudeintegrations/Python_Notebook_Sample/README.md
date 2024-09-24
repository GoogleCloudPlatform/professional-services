# BQ+Claude Art Sample Project

This README provides instructions for setting up and running the BQ+Claude3 Art Sample project.

## Prerequisites

- Access to Google Cloud Platform (GCP)
- BigQuery enabled in your GCP project

## Setup Instructions

### Step 1: Load Raw Data

1. Locate the `object.csv` file containing the raw data.
2. Create a new BigQuery Dataset in your GCP project.
3. Load the `object.csv` file into the newly created BigQuery Dataset.

For detailed instructions on loading data into BigQuery, refer to the [BigQuery documentation](https://cloud.google.com/bigquery/docs/loading-data).

### Step 2: Upload Sample Python Notebook

1. Navigate to the BigQuery console in your GCP project.
2. Go to the Notebooks section.
3. Upload the "BQ+Claude_Museum_Art_Sample" notebook to BigQuery.

For step-by-step instructions on uploading notebooks to BigQuery, follow the guide in the [official documentation](https://cloud.google.com/bigquery/docs/create-notebooks#upload_notebooks).

## Running the Notebook

After completing the setup steps, you can open, edit the fields like project id according to your environment and run the "BQ+Claude3_Art_Sample" notebook in the BigQuery Notebooks environment.

## Support

If you encounter any issues or have questions, please refer to the [BigQuery documentation](https://cloud.google.com/bigquery/docs) or contact your GCP support team.

