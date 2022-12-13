# Packer variables file template.
# Used by Terraform to generate Packer variable file.
project_id         = "${PROJECT_ID}"
compute_zone       = "${COMPUTE_ZONE}"
builder_sa         = "${BUILDER_SA}"
compute_sa         = "${COMPUTE_SA}"
compute_subnetwork = "${COMPUTE_SUBNETWORK}"
use_iap            = ${USE_IAP}