#!/bin/bash

# run the original gh command
if [ -f "token.txt" ]; then
  GITHUB_TOKEN=$(cat token.txt) /bin/gh "$@"
else
  /bin/gh "$@"
fi
