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
{{ $botoVersion := MakeMap -}}
{{ $botoVersion = AddToMap $botoVersion "python2.7" "boto3==1.17.100 botocore==1.20.100" -}}
{{ $botoVersion = AddToMap $botoVersion "python3.6" "boto3==1.18.55 botocore==1.21.55" -}}
{{ $botoVersion = AddToMap $botoVersion "python3.7" "boto3==1.18.55 botocore==1.21.55" -}}
{{ $botoVersion = AddToMap $botoVersion "python3.8" "boto3==1.18.55 botocore==1.21.55" -}}
{{ $botoVersion = AddToMap $botoVersion "python3.9" "boto3==1.18.55 botocore==1.21.55" -}}

{{ $pythonImage := MakeMap -}}
{{ $pythonImage = AddToMap $pythonImage "python2.7" "python:2.7-alpine" -}}
{{ $pythonImage = AddToMap $pythonImage "python3.6" "python:3.6-alpine" -}}
{{ $pythonImage = AddToMap $pythonImage "python3.7" "python:3.7-alpine" -}}
{{ $pythonImage = AddToMap $pythonImage "python3.8" "python:3.8-alpine" -}}
{{ $pythonImage = AddToMap $pythonImage "python3.9" "python:3.9-alpine" -}}

# Build Lambda execution environment
FROM {{ index $pythonImage .Runtime }} AS build-image

RUN apk add --no-cache --upgrade cmake make g++ unzip autoconf automake libtool libexecinfo-dev curl-dev
{{template "installApp" .}}

RUN pip install --force-reinstall --target . awslambdaric {{ index $botoVersion .Runtime }}
RUN if [ -e requirements.txt ] ; then pip install -r requirements.txt ; fi

FROM {{ index $pythonImage .Runtime }}
{{template "copyLambdaCompat"}}

RUN apk add --no-cache --upgrade nghttp2-libs brotli-libs libstdc++
COPY --from=build-image /app /app

WORKDIR /app
ENTRYPOINT ["/lambda-compat"]
CMD ["python", "-m", "awslambdaric", "{{ .Handler }}"]

