#!/bin/bash
# add_license_headers.sh
# 
# Add Apache 2.0 license headers to all Python source files
# This script adds the required Google LLC copyright notice

set -e

HEADER='# Copyright 2026 Google LLC
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
'

echo "Adding Apache 2.0 license headers to Python files..."
echo ""

count=0
for file in agent/*.py localtest.py main.py tests/test_*.py tests/conftest.py; do
    if [ -f "$file" ]; then
        if ! head -1 "$file" | grep -q "Copyright"; then
            echo "Adding header to: $file"
            echo "$HEADER" | cat - "$file" > "$file.tmp" && mv "$file.tmp" "$file"
            ((count++))
        else
            echo "Skipping (already has header): $file"
        fi
    fi
done

echo ""
echo "✓ Added $count license headers"
echo ""
echo "Verify with:"
echo "  grep -l 'Copyright 2026 Google LLC' agent/*.py localtest.py main.py tests/test_*.py"
