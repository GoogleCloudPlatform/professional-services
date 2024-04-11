#!/bin/bash
# Copyright 2024 Google LLC
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#    http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.

# Basic error handling if not enough parameters are provided
if [ "$#" -lt 4 ]; then
    echo "Usage: $0 --src <source_path> --tgt <target_path>"
    exit 1
fi

# Parse the parameters
while [[ $# -gt 0 ]]; do
    case $1 in
        --src)
            SRC_PATH="$2"
            shift # Shift past the argument
            shift # Shift past the value
            ;;
        --tgt)
            TGT_PATH="$2"
            shift 
            shift 
            ;;
        *)
            echo "Unknown option: $1"
            exit 1
            ;;
    esac
done

# Verify that source and target paths were provided
if [ -z "$SRC_PATH" ] || [ -z "$TGT_PATH" ]; then
    echo "Error: Both --src and --tgt parameters are required."
    exit 1
fi

# Example action using the parameters (you'll replace this)
echo "Source path: $SRC_PATH"
echo "Target path: $TGT_PATH"

python3 scripts/generate_dag_metadata.py --src="$SRC_PATH" --tgt="$TGT_PATH"
black "$TGT_PATH" --preview
