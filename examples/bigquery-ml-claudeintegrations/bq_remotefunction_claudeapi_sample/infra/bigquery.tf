/**
 * Copyright 2024 Google LLC
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

resource "google_bigquery_connection" "remote_function" {
    project       = var.project
    connection_id = "claude-remotefunction"
    location      = "US"

    cloud_resource { }
}

resource "google_bigquery_routine" "remote_function" {
    project         = var.project
    dataset_id      = var.routine_dataset
    routine_id      = "claude_messages"
    routine_type    = "SCALAR_FUNCTION"
    definition_body = ""
    return_type     = "{\"typeKind\" :  \"JSON\"}"

    arguments {
        name      = "message"
        data_type = "{\"typeKind\" :  \"STRING\"}"
    }

    remote_function_options {
        endpoint             = google_cloudfunctions2_function.function.url
        connection           = google_bigquery_connection.remote_function.name
        max_batching_rows    = var.max_batching_rows
        user_defined_context = {
        "max-tokens"    : var.max_tokens,
        "system-prompt" : var.system_prompt
        }
    }
}