{{/*
   Copyright 2022 Google LLC
   Licensed under the Apache License, Version 2.0 (the "License");
   you may not use this file except in compliance with the License.
   You may obtain a copy of the License at

       http://www.apache.org/licenses/LICENSE-2.0

   Unless required by applicable law or agreed to in writing, software
   distributed under the License is distributed on an "AS IS" BASIS,
   WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   See the License for the specific language governing permissions and
   limitations under the License.
*/}}
{{define "buildLambdaCompat"}}
FROM golang:1.17-alpine AS build-compat
RUN apk add --no-cache --upgrade git
RUN go install github.com/GoogleCloudPlatform/professional-services/tools/lambda-compat/cmd/lambda-compat
{{end}}
{{define "copyLambdaCompat"}}
COPY --from=build-compat /go/bin/lambda-compat /lambda-compat
{{end}}
{{define "commonEnvironmentVars"}}
{{if gt (len .Environment.Variables) 0}}
{{range $k, $v := .Environment.Variables}}
ENV {{$k}}={{$v}}
{{end}}
{{end}}
{{end}}
{{define "installApp"}}
RUN mkdir /app
WORKDIR /app
COPY {{ .CodeUri }}* ./
{{if (HasSuffix .CodeUri ".zip")}}
RUN unzip {{ .CodeUri }}
{{end}}
{{end}}