

################################# Quickstart #################################

# cleaning up example keys

- rm -f /public-keys/data-uploader/
- rm -f /public-keys/prisma-security/

# generate keys for service accounts

- mkdir keys && cd keys
- openssl req -x509 -nodes -newkey rsa:2048 -days 30 \
    -keyout data_uploader_private_key.pem \
    -out ../public-keys/data-uploader/public_key.pem \
    -subj "/CN=unused"
- openssl req -x509 -nodes -newkey rsa:2048 -days 30 \
    -keyout prisma_security_private_key.pem \
    -out ../public-keys/prisma-security/public_key.pem \
    -subj "/CN=unused"

# deploy service accounts and keys

- cd ..
- terraform init
- terraform apply -var project_id=$GOOGLE_CLOUD_PROJECT


# extract JSON credentials templates from terraform output and put the private part of the keys into templates

- terraform show -json | jq '.values.outputs."sa-credentials".value."data-uploader"."public_key.pem" | fromjson' > data-uploader.json
- terraform show -json | jq '.values.outputs."sa-credentials".value."prisma-security"."public_key.pem" | fromjson' > prisma-security.json

- contents=$(jq --arg key "$(cat keys/data_uploader_private_key.pem)" '.private_key=$key' data-uploader.json) && echo "$contents" > data-uploader.json
- contents=$(jq --arg key "$(cat keys/prisma_security_private_key.pem)" '.private_key=$key' prisma-security.json) && echo "$contents" > prisma-security.json



# validate that service accounts json credentials are valid

- gcloud auth activate-service-account --key-file prisma-security.json
- gcloud auth activate-service-account --key-file data-uploader.json


# cleaning up
- terraform destroy -var project_id=$GOOGLE_CLOUD_PROJECT
