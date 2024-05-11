param($tag, $version)
$projectID = gcloud config get-value project
$env:DOCKER_CLI_EXPERIMENTAL = 'enabled'
gcloud --quiet auth configure-docker
docker build -t gcr.io/$projectID/servercore:${tag}_${version} --build-arg version=${version} .
docker push gcr.io/$projectID/servercore:${tag}_${version}