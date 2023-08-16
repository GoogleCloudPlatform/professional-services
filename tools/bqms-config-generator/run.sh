#!/bin/bash
# Copyright 2023 Google. This software is provided as-is, without warranty or
# representation for any use or purpose. Your use of it is subject to your
# agreement with Google.

# Validate CONF_PREP_PATH argument
if [[ -z "$1" ]]; then
  echo "Usage: $0 CONF_PREP_PATH"
  exit 1
fi

CONF_PREP_PATH=$1

# Convert relative path to absolute path if necessary
if [[ ! "$CONF_PREP_PATH" = /* ]]; then
  CONF_PREP_PATH="$PWD/$CONF_PREP_PATH"
fi

# Check if CONF_PREP_PATH exists
if [[ ! -f "$CONF_PREP_PATH" ]]; then
  echo "Error: $CONF_PREP_PATH does not exist or is not a directory"
  exit 1
fi

# Execute bqms-config-generator command
bqms-config-generator -c "$CONF_PREP_PATH"
