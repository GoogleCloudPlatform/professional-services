# Copyright 2020 Google Inc. All rights reserved.
#
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

# Environment Variables
PROJECT_ID = "GOOGLE_CLOUD_PROJECT"
PUBSUB_TOPIC = "TOPIC"

# Default Values
MAX_CONTENT_MB = 5 * 1000000
PUBSUB_TIMEOUT_MS = 10 * 60 * 1000

# Exception Messages
UNSUPPORTED_METHOD = "HTTP ERROR: {method} Request Unsupported"
NO_DATA_MESSAGE = "HTTP ERROR: POST Request Missing Data"
MESSAGE_TOO_BIG = "HTTP ERROR: Requested data {content_length} bytes bigger than max {max_bytes}"
TIMEOUT_MESSAGE = "HTTP ERROR: Timeout occured while processing data"
