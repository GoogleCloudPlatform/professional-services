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
{{ $rubyImage := MakeMap -}}
{{ $rubyImage = AddToMap $rubyImage "ruby2.7" "ruby:2.7-alpine" -}}
{{ $rubyImage = AddToMap $rubyImage "ruby2.5" "ruby:2.5-alpine" -}}

# Build Lambda execution environment
FROM {{ index $rubyImage .Runtime }}

{{template "installApp" .}}

RUN gem install aws_lambda_ric
RUN if [ -e Gemfile ] ; then bundle install ; fi

{{template "copyLambdaCompat"}}
WORKDIR /app
ENTRYPOINT ["/lambda-compat"]
CMD ["/usr/local/bundle/bin/aws_lambda_ric", "{{ .Handler }}"]

