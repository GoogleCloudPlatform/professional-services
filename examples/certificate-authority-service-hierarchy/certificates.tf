/**
 * Copyright 2023 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

resource "google_privateca_certificate" "cert_request" {
  pool                  = module.sub-pool1.name
  project               = data.google_project.main.project_id
  location              = var.location1
  lifetime              = "2592000s"
  name                  = var.cert_name
  pem_csr               = tls_cert_request.demo_leaf_cert.cert_request_pem

  depends_on = [
    module.sub-pool1,
    module.sub-ca1
  ]
}

resource "tls_private_key" "pem_key" {
  algorithm = "RSA"
  rsa_bits  = 4096
}

resource "tls_cert_request" "demo_leaf_cert" {
  private_key_pem = tls_private_key.pem_key.private_key_pem

  subject {
    common_name  = var.domain
    organization = var.organization_name
  }
}


resource "null_resource" "certificate_file_save" {
  triggers = {
    data_set = "${google_privateca_certificate.cert_request.pem_csr}"
  }

  provisioner "local-exec" {
    command = <<EOT
      gcloud privateca certificates export ${google_privateca_certificate.cert_request.name} --project ${var.project_id} --issuer-pool ${var.sub_pool1_name} --issuer-location ${var.location1} --include-chain --output-file ${var.project_id}-${google_privateca_certificate.cert_request.name}-chain.crt
      gcloud privateca certificates export ${google_privateca_certificate.cert_request.name} --project ${var.project_id} --issuer-pool ${var.sub_pool1_name} --issuer-location ${var.location1} --output-file ${var.project_id}-${google_privateca_certificate.cert_request.name}.crt
  
    EOT
  }
  depends_on = [
    module.sub-ca1,
    google_privateca_certificate.cert_request,
  ]
}
