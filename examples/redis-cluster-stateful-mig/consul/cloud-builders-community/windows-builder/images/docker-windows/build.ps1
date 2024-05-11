$projectID = gcloud config get-value project;
docker build -t gcr.io/$projectID/docker-windows .;
if ($?) {
    docker push gcr.io/$projectID/docker-windows;
}