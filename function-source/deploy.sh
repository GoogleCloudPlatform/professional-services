#deploy cf and create a job in scheduler
CF_NAME="bb-test-cf"
CS_NAME="bb-test2-cs"
TOPIC_NAME="bq-exports"
TOPIC_PATH="projects/report-scheduling/topics/bq-exports"
PROJECT_ID="report-scheduling"
SCHEDULE="26 17 27 3 *"

gcloud functions deploy "$CF_NAME" --entry-point=main --trigger-topic "$TOPIC_NAME" --runtime python37 --memory "512MB" --service-account "$SVC_ACCOUNT_EMAIL" --project "$PROJECT_ID" --allow-unauthenticated --set-env-vars SVC_ACCOUNT_EMAIL="$SVC_ACCOUNT_EMAIL",SENDGRID_API_KEY="$SENDGRID_API_KEY"
gcloud scheduler jobs create pubsub "$CS_NAME" --schedule="$SCHEDULE" --topic="$TOPIC_PATH" --message-body="bqemail" --project="$PROJECT_ID"

#"ERROR"- (gcloud) value for field [projectsId] in collection [pubsub.projects.topics] is required but was not provided
#when topic id is put instead of topic name. Since topic name had a path defing with the project and the topic id, it is confusing to the users. 
