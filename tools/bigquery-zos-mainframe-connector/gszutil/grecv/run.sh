#!/bin/bash

# Copyright 2022 Google LLC All Rights Reserved.
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

# This script downloads and extracts tar files then runs GRecv
# pkguri is expected to be gs://bucket/version
useradd -m -s /bin/bash -U grecv
sudo -u grecv -i <<'EOF'
  set -euxo pipefail
  uri=$(curl -s -f -H "Metadata-Flavor: Google" "http://metadata.google.internal/computeMetadata/v1/instance/pkguri" 2>/dev/null)
  gsutil -m rsync -r "$uri" .
  for f in $(ls *.tar); do tar xfo $f; done
  jar=$(ls mainframe-connector*jar | tail -n 1)
  jdk/bin/java -Xms4g -Xmx4g -cp "$jar:lib/*" com.google.cloud.imf.GRecv
EOF
shutdown -h now
