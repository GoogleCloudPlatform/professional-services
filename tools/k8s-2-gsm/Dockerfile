# sudo docker run -v ${KUBECONFIG}:/root/.kube/config:rw \
# -e GOOGLE_APPLICATION_CREDENTIALS=/gcp/creds.json \
# -v ${GOOGLE_APPLICATION_CREDENTIALS}:/gcp/creds.json:ro \
# CONTAINER-NAME:TAG ./k8s-2-gsm --help
FROM golang:1.19 as build

WORKDIR /go/src/app
COPY . .

RUN go mod download \
 && go vet -v \
 && CGO_ENABLED=0 go build -o /go/bin/k8s-2-gsm

# FROM gcr.io/distroless/static-debian11:debug
# sudo docker run -it --entrypoint=sh REPO/CONTAINER:TAG
FROM gcr.io/distroless/static-debian11

COPY --from=build /go/bin/k8s-2-gsm /
COPY --from=build /go/src/app/templates /templates
ENTRYPOINT ["/k8s-2-gsm"]