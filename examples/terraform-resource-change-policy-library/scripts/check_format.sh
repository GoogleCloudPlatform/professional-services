#!/bin/bash

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
