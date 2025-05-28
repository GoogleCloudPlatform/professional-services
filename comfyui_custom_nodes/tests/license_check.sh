#!/bin/bash
# Copyright 2025 Google LLC. This software is provided as-is, without warranty
# or representation for any use or purpose. Your use of it is subject to your
# agreement with Google.

# Checks that all python and YAML files under have the following license:
#
# Copyright 2025 Google LLC. This software is provided as-is, without warranty
# or representation for any use or purpose. Your use of it is subject to your
# agreement with Google.

header="Copyright [0-9]{4} Google LLC. This software is provided as-is"
# All code and files containing business logic should include a license header.
# This should check that all Python (excluding __init__.py) and YAML files
# include the license. All other file types must be checked manually.
files=("$(git ls-files '*[a-z].py' '*[a-z].yaml')")
bad_files=()

if [ -z "$files" ]; then exit 0; fi
for file in "${files[@]}"; do
    bad_files+=($(grep -EL "$header" $file))
done

if [ -n "$bad_files" ]
then
    echo "Copyright header missing from following files:"
    for file in "${bad_files[@]}"; do
        echo "   - $file";
    done
    exit 1;
else
    echo "Check completed successfully.";
    exit 0;
fi
