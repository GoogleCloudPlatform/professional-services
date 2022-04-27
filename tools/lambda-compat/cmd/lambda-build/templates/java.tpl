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
{{ $javaImage := MakeMap -}}
{{ $javaImage = AddToMap $javaImage "java11" "openjdk:11-alpine" -}}
{{ $javaImage = AddToMap $javaImage "java8.al2" "adoptopenjdk/openjdk8:alpine" -}}
{{ $javaImage = AddToMap $javaImage "java8" "adoptopenjdk/openjdk8:alpine" -}}

# Build Lambda execution environment
FROM {{ index $javaImage .Runtime }}

{{template "installApp" .}}

# RUN mvn package shade:shade

{{template "copyLambdaCompat"}}
WORKDIR /app
ENTRYPOINT ["/lambda-compat"]
CMD [ "/usr/bin/java", "-cp", "./*", "com.amazonaws.services.lambda.runtime.api.client.AWSLambda", "{{ .Handler }}" ]

