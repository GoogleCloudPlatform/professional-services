#!/bin/bash

# Copyright 2020 Google LLC
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#      http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.

set -euo pipefail

# Confirm we have run `make build` by:
# 1) Running make build in a tmp directory
# 2) Diffing the results
function check_build() {
  WORKDIR=$(pwd)
  TMPDIR=$(mktemp -d)

  rval=0
  cp -rf ./* "${TMPDIR}"

  cd "${TMPDIR}"
  make build >/dev/null 2>/dev/null
  diff -r \
    --exclude=".git" \
    "${WORKDIR}/policies/" "${TMPDIR}/policies/"
  rc=$?
  if [[ "${rc}" -ne 0 ]]; then
    echo "Error: Policy building has not been run"
    echo "Run 'make build' and commit the above changes."
    ((rval++))
  fi
  cd "${TMPDIR}"
  rm -Rf "${TMPDIR}"
  return $((rval))
}

check_build
