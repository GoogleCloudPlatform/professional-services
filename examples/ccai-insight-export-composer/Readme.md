## Ingesting CCAI-Insights Data to BigQuery

Contact Center AI (CCAI) Insights can be used to generate insights from voice and chat conversations. This BLOG will walk you through how to leverage this tool to analyze call conversations and generate call sentiment, key highlights and call intent.
CCAI Insights enable customers to detect and visualize patterns in their contact center data (both voice calls and chat data). Understanding conversational data drives business value, improves operational efficiency, and provides a voice for customer feedback. Using topic modeling, custom highlights and smart highlights intents are extracted from conversations With thousands of conversation data, meaningful topic trends can be identified.
After topic trends are identified, the next step for the customer would be to summarize these results and answer key business questions like “What is the correlation between call duration and topic?”, “What percent of calls are competitors mentioned?”, “What topics are related to attrition?”, “How do topics trend overtime?”, etc. This is where BigQuery comes into play. Conversations and their insights can be exported to BigQuery to support further data aggregation and analytics.

### Enable require services and configure CCAI Insights
Lets enable some of the services required for CCAI Insights
 
gcloud services enable storage-component.googleapis.com speech.googleapis.com contactcenterinsights.googleapis.com datalabeling.googleapis.com composer.googleapis.com

 
Configure CCAI Insights: Review the CCAI Settings Resource page for the list of configurable fields. Listed below are some key fields you may want to configure:
- conversation_ttl: the TTL for a newly-created conversation. Conversations with no expiration time will remain until deleted.
- Analysis_config {runtimeIntegrationAnalysisPercentage}: the percentage of conversations to be analyzed (0 - 100). Default value is 100. Customers may consider adjusting this value from 100% if they’d like to reduce cost or processing time.

The following sample API updates the CCAI setting so that only 50 percent of the conversation are analyzed and the conversations are deleted after 500s

```

export runtime_analysis_percentage=50
export conversation_ttl=500s
export insight_project_id=<<insight_project_id>>
export region="us-central1"

curl -H "Content-Type: application/json" \
-H "Authorization: Bearer $(gcloud auth application-default print-access-token)" \
-d { "analysisConfig": {"runtimeIntegrationAnalysisPercentage": "${runtime_analysis_percentage}"}, "conversationTtl": "${conversation_ttl}"} \
-X PATCH "https://contactcenterinsights.googleapis.com/v1alpha1/projects/${insight_project_id}/locations/${region}/settings?updateMask=analysisConfig,conversationTtl"

```


### Schedule and run the Ingestion process through Cloud Composer

We have already enabled composer in Step 1. Create a composer environment if you have not already created one. In this step we will also walk through the DAG used to ingest the data

Step 1: Lets create a connection Id for the CCAI Insights API as shown below:

![CCAI-Insights Connection Id in Airflow](images/connection-insights.jpg)

Step 2: Create dataset and table to copy data from insight to BQ


Step 3: Create a json varaible for ccai-insight configuration by navigating to Admin > Variables in Airflow UI. Below is the screenshot.

![CCAI-Insights Varaible in Airflow](images/airflow_ccai_config.jpg)

Make sure to change the <<project_id_for_ccai>>, <<project_id_for_bq>>, BQ_DATASET (ccai_ds) and BQ_TABLE (ccai). 


Step 4: Give the composer service account the role `roles/contactcenterinsights.editor`. Get the project number from the project where CCAI is enabled. Give the ccai insight service account (in the form service-PROJECT_NUMBER@gcp-sa-contactcenterinsights.iam.gserviceaccount.com), BigQuery editor permission on the ccai_ds dataset.

service-PROJECT_NUMBER@gcp-sa-contactcenterinsights.iam.gserviceaccount.com 


Step 5: Create an Apache Airflow DAG. The code here is an example for DAG that call the API and exports data to BigQuery. The job will first export the conversations to BQ which have been created in the last hour. Then it will check the status of the export to ensure it was successful. Below is the visualization of the DAG graph view.

