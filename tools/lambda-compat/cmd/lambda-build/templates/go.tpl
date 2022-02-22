#   Copyright 2022 Google LLC
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

{{template "buildLambdaCompat" -}}
{{template "commonEnvironmentVars" .}}
{{ $goImage := MakeMap -}}
{{ $goImage = AddToMap $goImage "go1.x" "golang:1-alpine" -}}

# Build Lambda execution environment
FROM {{ index $goImage .Runtime }}

{{template "installApp" .}}

{{- if not (HasSuffix .CodeUri ".zip") -}}
RUN apk add --no-cache --upgrade git
RUN if [ ! -e go.mod ] ; then go mod init main ; fi
RUN GO111MODULE=auto GOOS=linux go get -d ./...
RUN GO111MODULE=auto GOOS=linux go build -o {{ .Handler }}
{{- end -}}

{{template "copyLambdaCompat"}}
WORKDIR /app
ENTRYPOINT ["/lambda-compat"]
CMD ["./{{ .Handler }}"]

