# Copyright 2021 Google LLC
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

FROM golang:1.16-buster as build

WORKDIR /go/src/app
ADD ./container /go/src/app

RUN go build -tags docker -o /go/bin/app *.go

FROM gcr.io/distroless/base-debian11
COPY ./container/migrations /migrations
COPY ./infrastructure/output /terraform
COPY --from=build /go/bin/app /
CMD ["/app"] 
