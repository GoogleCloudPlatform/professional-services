# Copyright 2019 The inspec-gcp-cis-benchmark Authors
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#     https://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.

# Include all from this benchmark except:
include_controls 'inspec-gcp-cis-benchmark' do
  skip_control 'cis-gcp-4.6-vms' # Inspec-GCP support for KMS-backed CSEKs
  skip_control 'cis-gcp-7.1-gke' # Logging is handled by a custom exporter to Stackdriver
  skip_control 'cis-gcp-7.12-gke' # Overridden by local check
  skip_control 'cis-gcp-7.14-gke' # PSP check support in process https://github.com/inspec/inspec-gcp/issues/174
  skip_control 'cis-gcp-1.3-iam' # Need to allow user-managed key for Terraform
end

# Include all from this benchmark except:
include_controls 'inspec-gcp-pci-3.2.1' do
  skip_control 'pci-dss-3.2.1-7.1.2' # PSO IAM Role bindings needed for this project
  skip_control 'pci-dss-3.2.1-3.5.3' # SOFTWARE kms instead of HSM-backed for demo/cost
  skip_control 'pci-dss-3.2.1-6.3.2' # GKE Binary Auth check not yet supported
  skip_control 'pci-dss-3.2.1-2.4' # CAI Inventory
  skip_control 'pci-dss-3.2.1-10.5.4' # GKE Logging to SD
  skip_control 'pci-dss-3.2.1-3.1' # PII Bucket not in use

  skip_control 'pci-dss-3.2.1-3.1' # PII Bucket not in use
end
