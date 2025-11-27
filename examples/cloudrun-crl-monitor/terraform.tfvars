/**
 * Copyright 2025 Google LLC
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

project_id         = "sshsergey-argolis"

crl_monitors = [
  {
    name                     = "bsi-ca"
    region             = "europe-west3"
    target_url               = "http://download.gsb.bund.de/BSI/crl/DE_CRL.crl"
    schedule                 = "* * * * *"
    crl_expiration_buffer    = "3600s"
  },
  {
    name                     = "google-ca"
    region             = "europe-west3"
    target_url               = "http://c.pki.goog/we2/64OUIVzpZV4.crl"
    schedule                 = "* * * * *"
    crl_expiration_buffer    = "3600s"
  }
]

alert_duration_threshold = "60s"
