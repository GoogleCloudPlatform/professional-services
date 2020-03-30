#make service account
SA_NAME="test-bb-svc"
SVC_DESC="test-service-account"
PROJECT_ID="report-scheduling"
gcloud iam service-accounts create $SA_NAME --description "$SVC_DESC" --project "$PROJECT_ID"
export SVC_ACCOUNT_EMAIL=$(gcloud iam service-accounts list --filter="name:$SA_NAME" --format "value(email)")

gcloud iam service-accounts add-iam-policy-binding $SVC_ACCOUNT_EMAIL --member="serviceAccount:$SVC_ACCOUNT_EMAIL" --role='roles/editor' --project "$PROJECT_ID"

gcloud projects add-iam-policy-binding $PROJECT_ID --member="serviceAccount:$SVC_ACCOUNT_EMAIL" --role='roles/editor'

gcloud projects add-iam-policy-binding $PROJECT_ID --member="serviceAccount:$SVC_ACCOUNT_EMAIL" --role='roles/iam.serviceAccountTokenCreator'

