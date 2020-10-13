FROM golang:1.14 AS builder

WORKDIR /go/src/github.com/GoogleCloudPlatform/professional-services/tools/gcpviz
COPY go.mod go.sum *.go ./
COPY cmd/*.go ./cmd/
RUN cd cmd
RUN CGO_ENABLED=0 GOOS=linux go build -a -installsuffix cgo -o $GOPATH/bin ./...

FROM google/cloud-sdk:slim

RUN apt-get update
RUN apt-get install -y graphviz

WORKDIR /gcpviz
COPY --from=builder /go/bin/cmd gcpviz
COPY style.yaml relations.yaml labels.yaml ./
COPY wait_for_export.sh gcpviz.sh ./
COPY redactor.py requirements.txt ./
COPY queries ./queries/
RUN pip3 install -r requirements.txt

RUN chmod +x wait_for_export.sh gcpviz.sh redactor.py

ENV PATH "$PATH:/gcpviz"

