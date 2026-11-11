#!/usr/bin/env bash

# Copyright 2026 Google LLC
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#     https://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.

# Fails if the repository contains identifiers that must not be published (project IDs, billing IDs, emails).
# Usage: tools/check_no_ids.sh [extra_pattern ...]
set -euo pipefail
cd "$(dirname "$0")/.."
PATTERNS=("[a-z]+-[a-z]+-[0-9]{6}\b" "[0-9A-F]{6}[-_][0-9A-F]{6}[-_][0-9A-F]{6}" "service-[0-9]{9,}@" "@google\.com" "\bgo/[a-z]" "\bb/[0-9]{6,}" "$@")
FOUND=0
for p in "${PATTERNS[@]}"; do
  if git ls-files -co --exclude-standard . | grep -v 'check_no_ids.sh$' | grep -vE '\.(png|jpg)$' \
     | xargs grep -nEI "$p" 2>/dev/null | grep -vE 'XXXXXX_XXXXXX_XXXXXX'; then
    echo "^ matches for pattern: $p" >&2; FOUND=1
  fi
done
[[ $FOUND -eq 0 ]] && echo "No identifiers found."
exit $FOUND
