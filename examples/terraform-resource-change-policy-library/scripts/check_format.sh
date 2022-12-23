#!/bin/bash

# Copyright 2022 Google LLC
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

# opa fmt always exists 0 (as of v0.15.0) so we have to check if it generates
# output rather than the exit code.
diff="$(opa fmt -d lib/ validator/)"
if [[ "$diff" == "" ]]; then
  exit
fi

echo "Formatting error:"
echo "$diff"
echo ""
echo "Run \"make format\" in your client to fix."
exit 1
