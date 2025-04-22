// Copyright 2025 Google LLC
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//     http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

pub const COMPUTE_ENDPOINT: &'static str = "https://compute.googleapis.com";
pub const CONTAINER_ENDPOINT: &'static str = "https://container.googleapis.com";
pub(crate) const DEFAULT_TOKEN_URI: &'static str =
    "http://metadata.google.internal/computeMetadata/v1/instance/service-accounts/default/token";
pub(crate) const PROJECT_ID_URI: &'static str =
    "http://metadata.google.internal/computeMetadata/v1/project/project-id";
pub(crate) const CLUSTER_ID_URI: &'static str =
    "http://metadata.google.internal/computeMetadata/v1/instance/attributes/cluster-name";
pub(crate) const INSTANCE_ZONE_URI: &'static str =
    "http://metadata.google.internal/computeMetadata/v1/instance/zone";
pub(crate) const GCP_TOKEN_URI: &str = "https://oauth2.googleapis.com/token";
pub(crate) const CREDENTIALS_FILE: &str = ".config/gcloud/application_default_credentials.json";
