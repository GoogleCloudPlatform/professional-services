/**
 * Copyright 2022 Google LLC
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

output "credentials" {
  value = jsonencode({
    "type" : "external_account",
    "audience" : "${local.audience}",
    "subject_token_type" : "urn:ietf:params:oauth:token-type:jwt",
    "token_url" : "https://sts.googleapis.com/v1/token",
    "credential_source" : data.external.oidc_token_file.result
    "service_account_impersonation_url" : "https://iamcredentials.googleapis.com/v1/projects/-/serviceAccounts/${var.impersonate_service_account_email}:generateAccessToken"
  })
}
