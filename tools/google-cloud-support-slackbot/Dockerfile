# Copyright 2022 Google LLC

# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#     http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.

FROM	python:3.7-slim AS compile-image
LABEL   author="Damian Lance"
LABEL   created="2022-01-19"
LABEL   last_updated="2022-01-19"

RUN	python -m venv /opt/venv
ENV	PATH="/opt/venv/bin:$PATH"

COPY	. ./
RUN     apt-get update; \
        apt-get -y install \
        libffi-dev \
        libssl-dev; \
	pip3 install -r requirements.txt;
		
FROM	python:3.7-slim AS build-image

# Essential environment variables
ENV	ORG_ID="YOUR NUMERIC ORG ID"
ENV	SLACK_TOKEN="YOUR SLACK TOKEN"
ENV	SIGNING_SECRET="YOUR SLACK SIGNING SECRET"
ENV	API_KEY="YOUR API KEY FOR GOOGLE CLOUD SUPPORT AND CLOUD FIRESTORE"

# Testing environment variables
ENV	TEST_CHANNEL_ID="SLACK CHANNEL ID FOR TESTING"
ENV	TEST_CHANNEL_NAME="SLACK CHANNEL NAME FOR TESTING"
ENV	TEST_USER_ID="SLACK USER_ID FOR TESTING"
ENV	TEST_USER_NAME="SLACK USER_NAME FOR TESTING"
ENV	PROJECT_ID="GOOGLE CLOUD PROJECT ID FOR SUPPORT CASES"
ENV	PROJECT_NUMBER="GOOGLE CLOUD PROJECT NUMBER FOR SUPPORT CASES"

COPY	--from=compile-image . ./
ENV	PATH="/opt/venv/bin:$PATH"

ENTRYPOINT	/main.py

