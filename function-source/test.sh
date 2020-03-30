#test
CS_NAME="bb-test-cs"
TOPIC_NAME="projects/report-scheduling/topics/bq-exports"
PROJECT_ID="report-scheduling"
SCHEDULE="50 13 27 3 *"
gcloud scheduler jobs create pubsub "$CS_NAME" --schedule "$SCHEDULE" --topic "$TOPIC_NAME"