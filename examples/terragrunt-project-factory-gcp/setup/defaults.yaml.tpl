# Packer variables file template.
# Used by Terraform to generate Packer variable file.

# Directory with all .yaml definition of project specific data
data_dir             : "projects/"

folder_id            : "${FOLDER_ID}"

# Variable required by //src/main.tf module invocation
org_id               : "${ORG_ID}"
billing_account      : "${BILLING_ACCOUNT}"
