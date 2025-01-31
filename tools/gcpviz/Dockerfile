#   Copyright 2022 Google LLC
#
#   Licensed under the Apache License, Version 2.0 (the "License");
#   you may not use this file except in compliance with the License.
#   You may obtain a copy of the License at
#
#       http://www.apache.org/licenses/LICENSE-2.0
#
#   Unless required by applicable law or agreed to in writing, software
#   distributed under the License is distributed on an "AS IS" BASIS,
#   WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
#   See the License for the specific language governing permissions and
#   limitations under the License.
#

FROM golang:1.23 AS builder

WORKDIR /go/src/github.com/GoogleCloudPlatform/professional-services/tools/gcpviz
COPY go.mod go.sum *.go ./
RUN mkdir -p cmd/gcpviz
COPY cmd/gcpviz/*.go ./cmd/gcpviz
RUN cd cmd/gcpviz
RUN CGO_ENABLED=0 GOOS=linux go build -a -installsuffix cgo -o $GOPATH/bin ./...

FROM google/cloud-sdk:slim

RUN apt-get update && apt-get install -y graphviz

WORKDIR /gcpviz
COPY --from=builder /go/bin/gcpviz gcpviz
COPY style.yaml relations.yaml labels.yaml ./
COPY wait_for_export.sh gcpviz.sh ./
COPY redactor.py requirements.txt ./
COPY queries ./queries/

# Install dependencies here, we only have one dependency which doesn't ship as deb
# package for bookworm and other options are excessive:
RUN rm -f /usr/lib/python3.*/EXTERNALLY-MANAGED
RUN pip3 install -r requirements.txt

RUN chmod +x wait_for_export.sh gcpviz.sh redactor.py

ENV PATH="$PATH:/gcpviz"

