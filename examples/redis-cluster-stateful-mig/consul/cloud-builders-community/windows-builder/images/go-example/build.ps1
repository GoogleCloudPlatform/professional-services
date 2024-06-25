$projectID = gcloud config get-value project;
gcloud --quiet auth configure-docker;
docker build -t gcr.io/$projectID/go-example .;
if ($?) {
    docker push gcr.io/$projectID/go-example;
}