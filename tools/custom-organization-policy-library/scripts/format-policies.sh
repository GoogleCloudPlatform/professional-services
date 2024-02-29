#!/bin/bash

FOLDER_POLICIES="$1"

pushd $FOLDER_POLICIES > /dev/null
yq -s '.filename' policies.yaml 
rm policies.yaml
 
for file in *.yaml; do
  [ -f "$file" ] || continue  # Ensure it's a regular file

  SERVICE=`yq -r '.service' $file`
  mkdir -p $SERVICE
  yq -i 'del(.filename)' $file
  yq -i 'del(.service)' $file
  sed -i '' '/^---$/d' $file
  mv $file $SERVICE
done

popd > /dev/null
