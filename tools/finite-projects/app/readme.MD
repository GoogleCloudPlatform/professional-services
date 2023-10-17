
Requires folder to put all the projects under

Must provide default location for GCP credentials

for local environment use gcloud auth login and gcloud auth application-default login

Need to set PROJECT_PARENT_ID environmnet var  e.g. folders/387494730085


https://docs.spring.io/spring-cloud-gcp/docs/current/reference/html/sql.html
https://towardsdatascience.com/local-development-set-up-of-postgresql-with-docker-c022632f13ea

My local environmonet:
postgres
docker pull postgres
mkdir ${HOME}/postgres-data/

mkdir ${HOME}/postgres-data/

docker run -d --name postgres -e POSTGRES_PASSWORD=postgres -v ${HOME}/postgres-data/:/var/lib/postgresql/data -p 5432:5432 postgres


Set environment var SCHEDULE_EXPIRED_CRON=0 * * * * * so that it runs every min
Set environment var SCHEDULE_BILLING_CRON=0 * * * * * so that it runs every min



Need to set on Folder level
Org Policy limiting GCS retention to 0
IAM deny quota change?
IAM deny orgpolicy set
IAM deny project undelete

Set quotas for reservations, to 0 - compute, bigquery....?



Steps to delete project.
Remove any leins - to force delete vpc host project (list then iterate and remove)
Remove any cloud endpoints
then delete project
