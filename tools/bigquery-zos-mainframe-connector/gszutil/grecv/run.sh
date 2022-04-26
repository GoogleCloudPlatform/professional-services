#!/bin/bash
# Copyright 2020 Google Inc., all rights reserved
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
