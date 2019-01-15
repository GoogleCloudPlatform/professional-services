PROJECT_ID="$1"
IMAGE_NAME="sentiment-analysis"
TAG="latest"
GCR_IMAGE="gcr.io/${PROJECT_ID}/${IMAGE_NAME}:${TAG}"

docker build -t ${IMAGE_NAME} .
docker tag ${IMAGE_NAME} ${GCR_IMAGE}
docker push ${GCR_IMAGE}
docker image rm ${IMAGE_NAME}
docker image rm ${GCR_IMAGE}
