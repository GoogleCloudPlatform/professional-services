# Copyright 2022 Google LLC
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#      http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.

FROM golang:1.19-buster as builder

WORKDIR /build

COPY . .

RUN GOOS=linux GOARCH=amd64 go build -o /build/wordcount ./cmd

FROM gcr.io/dataflow-templates-base/go-template-launcher-base

ARG WORKDIR=/dataflow/template
RUN mkdir -p ${WORKDIR}

COPY --from=builder /build/wordcount ${WORKDIR}/wordcount

ENV FLEX_TEMPLATE_GO_BINARY="${WORKDIR}/wordcount"

ENTRYPOINT ["/opt/google/dataflow/go_template_launcher"]
