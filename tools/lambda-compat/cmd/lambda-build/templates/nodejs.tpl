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
{{ $baseImages := MakeMap -}}
{{ $baseImages = AddToMap $baseImages "nodejs4.3" "node:12-alpine" -}}
{{ $baseImages = AddToMap $baseImages "nodejs6.10" "node:12-alpine" -}}
{{ $baseImages = AddToMap $baseImages "nodejs8.10" "node:12-alpine" -}}
{{ $baseImages = AddToMap $baseImages "nodejs10.x" "node:12-alpine" -}}
{{ $baseImages = AddToMap $baseImages "nodejs12.x" "node:12-alpine" -}}
{{ $baseImages = AddToMap $baseImages "nodejs14.x" "node:14-alpine" -}}

# Build Lambda execution environment
FROM {{ index $baseImages .Runtime }} AS build-image

RUN apk add --no-cache --upgrade cmake make g++ unzip autoconf automake libtool libexecinfo-dev curl-dev python3
{{template "installApp" .}}

RUN npm install aws-lambda-ric
RUN npm install aws-sdk
RUN if [ -e package.json ] ; then npm install ; fi

FROM {{ index $baseImages .Runtime }}

RUN apk add --no-cache --upgrade nghttp2-libs brotli-libs

COPY --from=build-image /app /app
{{template "copyLambdaCompat"}}

{{template "commonEnvironmentVars" .}}
WORKDIR /app
ENTRYPOINT ["/lambda-compat"]
CMD ["/usr/local/bin/npx", "aws-lambda-ric", "{{ .Handler }}"]

