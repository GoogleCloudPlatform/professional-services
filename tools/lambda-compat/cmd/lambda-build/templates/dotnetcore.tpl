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

{{ $buildImages := MakeMap -}}
{{ $buildImages = AddToMap $buildImages "dotnetcore3.1" "mcr.microsoft.com/dotnet/core/sdk:3.1-alpine" -}}
{{ $buildImages = AddToMap $buildImages "dotnetcore2.1" "mcr.microsoft.com/dotnet/core/sdk:2.1-alpine" -}}

{{ $runtimeImages := MakeMap -}}
{{ $runtimeImages = AddToMap $runtimeImages "dotnetcore3.1" "mcr.microsoft.com/dotnet/core/aspnet:3.1-alpine" -}}
{{ $runtimeImages = AddToMap $runtimeImages "dotnetcore2.1" "mcr.microsoft.com/dotnet/core/aspnet:2.1-alpine" -}}

# Build Lambda execution environment
FROM {{ index $buildImages .Runtime }} AS build-image

{{template "installApp" .}}

RUN dotnet restore
{{ if not (HasSuffix .CodeUri ".zip") -}}
RUN dotnet publish -c Release -o .
{{- end }}
RUN dotnet tool install -g Amazon.Lambda.Tools

FROM {{ index $runtimeImages .Runtime }}
ENV DOTNET_RUNNING_IN_CONTAINER=true
ENV DOTNET_NOLOGO=true

COPY --from=build-image /root/.dotnet/tools/dotnet-lambda /app/dotnet-lambda
COPY --from=build-image /root/.dotnet /app/.dotnet
COPY --from=build-image /app /app

{{template "copyLambdaCompat"}}

WORKDIR /app
ENTRYPOINT ["/lambda-compat"]
CMD [", "{{ .Handler }}"]

