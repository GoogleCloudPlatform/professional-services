#!/bin/bash

# Check if the correct number of arguments is provided
if [ "$#" -ne 2 ]; then
  echo "Usage: $0 <base_directory> <output_csv_file>"
  echo "  <base_directory>:   The root directory containing service subfolders (e.g., ./samples/gcloud/custom-sha)"
  echo "  <output_csv_file>: The path where the output CSV should be saved (e.g., summary.csv)"
  echo ""
  echo "Example: $0 ../samples/gcloud/custom-sha summary.csv"
  exit 1
fi

BASE_DIR="$1"
OUTPUT_CSV="$2"

# Check if the base directory exists and is actually a directory
if [ ! -d "$BASE_DIR" ]; then
  echo "Error: Base directory '$BASE_DIR' not found or is not a directory."
  exit 1
fi

echo "Service,Type,Name,Description" > "$OUTPUT_CSV"
echo "Output CSV file set to: $OUTPUT_CSV"
echo "Searching for YAML files in: $BASE_DIR"

find "$BASE_DIR" -mindepth 2 -maxdepth 2 -type f -name '*.yaml' -print0 | while IFS= read -r -d $'\0' filepath; do
  filename=$(basename "$filepath")
  name="${filename%.yaml}"
  parent_dir=$(dirname "$filepath")
  service=$(basename "$parent_dir")
  description=$(grep -i '^description:' "$filepath" | sed -e 's/^[Dd]escription:[[:space:]]*//' -e 's/[[:space:]]*$//')
  type="Custom SHA"
  echo "\"$service\",\"$type\",\"$name\",\"$description\"" >> "$OUTPUT_CSV"
done

echo "Processing complete."
echo "CSV summary saved to: $OUTPUT_CSV"

exit 0