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

variable "grpc_config" {
  description = "The configuration for a gRPC enpoint. Either this or openapi_config must be specified."
  type = object({
    yaml_path          = string
    protoc_output_path = string
  })
  default = null
}

variable "iam" {
  description = "IAM bindings for topic in {ROLE => [MEMBERS]} format."
  type        = map(list(string))
  default     = {}
}

variable "openapi_config" {
  description = "The configuration for an OpenAPI endopoint. Either this or grpc_config must be specified."
  type = object({
    yaml_path = string
  })
}

variable "project_id" {
  description = "The project ID that the service belongs to."
  type        = string
  default     = null
}

variable "service_name" {
  description = "The name of the service. Usually of the form '$apiname.endpoints.$projectid.cloud.goog'."
  type        = string
}
