# Copyright 2026 Google LLC
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#     http://www.apache.org/licenses/LICENSE-8.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.

"""Prompts for generating Terraform configurations."""


def get_terraform_prompt(slo_report: str) -> str:
    """
    Returns the prompt for converting an SLO report into Terraform code.
    """
    prompt = f"""
    You are a Senior DevOps Engineer specializing in Google Cloud Platform (GCP) and Terraform.

    Your task is to convert the following text-based SLO Specification into VALID Terraform code.

    INPUT: SLO Specification Report
    {slo_report}

    INSTRUCTIONS:
    1. **Provider**: Use the `google` provider.
    2. **Resources**:
        - Create `google_monitoring_custom_service` resources.
        - Create `google_monitoring_metric_descriptor` resources for ALL custom metrics (including `workload.googleapis.com`).
        - Create `google_monitoring_slo` resources.
    3. **Logic**:
        - Analyze input for Request-based vs Windows-based SLIs.
        - Map MQL queries to `request_based_sli`.
        - Latency SLOs MUST use `distribution_cut`.

    ------------------------------------------------------------------
    CRITICAL TERRAFORM RULES (STRICT COMPLIANCE REQUIRED)
    ------------------------------------------------------------------
    1. **RESOURCE LABELS (Fixes "0 resource types" error)**:
        - **Context**: `k8s_container` resources ONLY support specific labels.
        - **WHITELIST**: You may ONLY use these `resource.labels`:
            - `container_name`
            - `pod_name`
            - `namespace_name`
            - `cluster_name`
            - `location`
        - **FORBIDDEN**: Do NOT invent labels like `service_name`, `workload_name`, `app`, or `deployment` in the `resource.labels` block, 
                as these cause API validation failures. Map these concepts to `container_name` or `pod_name` instead.

    2. **REGEX SYNTAX (Use Functions Only)**:
        - The SLO API rejects operators like `=~` and `!~`.
        - **REQUIRED**: Use `monitoring.regex.full_match`.
        - **Negation**: Use `NOT ... = monitoring.regex.full_match(...)`.

        Correct:
        `metric.labels.status = monitoring.regex.full_match("^2.*")`

        Correct (Negation):
        `NOT metric.labels.status = monitoring.regex.full_match("^5.*")`

    3. **USE HEREDOC FOR FILTERS (Fixes Escaping Errors)**:
        - DO NOT put filters in a single line with escaped quotes.
        - **REQUIRED**: Use Terraform Heredoc syntax `<<-EOT ... EOT`.

        Correct:
        filter = <<-EOT
          metric.type="workload.googleapis.com/foo" AND
          resource.type="k8s_container"
        EOT

    4. **BLOCK NESTING**:
        - `distribution_cut` and `good_total_ratio` MUST be nested inside `request_based_sli`.
        - They are NOT top-level blocks.

    5. **METRIC DOMAIN & CONSISTENCY**:
        - Use `workload.googleapis.com/` for custom metrics.
        - **NO SUFFIXES**: Do NOT append `_bucket`, `_count` to the metric name.
        - Name in `metrics.tf` MUST match `slos.tf` EXACTLY.

    6. **HANDLE API PROPAGATION DELAYS**:
        - **REQUIRED**: Create `time_sleep` "wait_for_metrics" (60s) in `main.tf`.
        - **REQUIRED**: Make it `depends_on` ALL metric descriptors.
        - **REQUIRED**: Add `depends_on = [time_sleep.wait_for_metrics]` to EVERY SLO.

    7. **STATUS CODE FILTERING**:
        - Status codes are STRINGS in Prometheus.
        - **Constraint**: You CANNOT use math (`<`, `>`).
        - **REQUIRED**: Use the Regex Function logic defined in Rule #2.

    8. **NO STRINGS IN RANGE BLOCKS**:
        - In `distribution_cut` -> `range`, `max` MUST be a raw number (`max = 0.5`).

    9. **PRE-REGISTER METRICS**:
        - You MUST define a `google_monitoring_metric_descriptor` for every custom metric.
        - **CRITICAL**: You CANNOT use the same metric for both Availability and Latency.
        - **Requirement**: Create **TWO DISTINCT** metric descriptors if a service has both SLO types.
        - This ensures SLOs can be created before data flows.
        - Labels: `value_type = "STRING"`.
          -  **Metric Kind**: MUST be `"CUMULATIVE"` or `"GAUGE"`.
          - **FORBIDDEN**: `"DELTA"` is NOT supported for custom metrics.
          - If the input implies a counter or rate, use `"CUMULATIVE"`.
          - If the input implies a histogram, use `"CUMULATIVE"` with `value_type="DISTRIBUTION"`.
        - **VALUE TYPE MAPPING**:
            **For AVAILABILITY SLOs:**
                - Metric Name suffix: `_count` (e.g. `view_cart_count`)
                - Descriptor Type: `value_type = "INT64"`
                - Descriptor Kind: `metric_kind = "CUMULATIVE"`
        
            **For LATENCY SLOs:**
                - Metric Name suffix: `_duration` or `_latency` (e.g. `view_cart_duration`)
                - Descriptor Type: `value_type = "DISTRIBUTION"`
                - Descriptor Kind: `metric_kind = "CUMULATIVE"`

    10. **RESOURCE TYPE CONSTRAINTS**:
        - Default to `resource.type="k8s_container"` unless context implies otherwise.
        - ALWAYS include the resource type in the filter.

    11. **LABEL STANDARDIZATION**:
        - **Resource Labels**: `resource.labels.container_name`, `namespace_name`.
        - **Metric Labels**: `metric.labels.http_status_code`.
        - **Constraint**: Never look for `container_name` inside `metric.labels`.

    12. **VERSION CONSTRAINTS**:
        - **Context**: `>~` is NOT a valid operator.
        - **REQUIRED**: Use `~>` or `>=`.
        - Correct: `version = "~> 5.13"`

    13. **SCHEMA ACCURACY (Fixes "Missing argument" error)**:
        - **Resource**: `google_monitoring_metric_descriptor`
        - **Hallucination Alert**: The argument to define the metric name is `type`. It is NOT `metric_type`.
        - **REQUIRED**:
          - Wrong: `metric_type = "workload.googleapis.com/foo"`
          - Correct: `type = "workload.googleapis.com/foo"`

    14. **CONTEXT-DRIVEN SERVICE GROUPING (Fixes Grouping Errors)**:
        - **Context**: The input report explicitly defines "Journeys" or "Services" (e.g., "Checkout Journey", "Payment Service").
        - **Requirement**: Use THESE names to create your `google_monitoring_custom_service` resources.
        - **FORBIDDEN**: Do NOT group SLOs based on the technical container name (e.g. `frontend`).
        - **Logic**:
          - IF the input says "SLO: Checkout Latency", attach it to a service named `checkout`.
          - IF the input says "SLO: Add to Cart", attach it to a service named `cart`.
          - **IGNORE**: The fact that the metric might come from `resource.labels.container_name="frontend"`. That is just technical implementation. 
          The **Service Entity** must match the **Business Journey**.

    15. **FILTER LOGIC (Fixes "Mixed AND/OR" error)**:
        - **Context**: The API fails if you mix `AND` and `OR` for the same label set.
        - **REQUIRED**: Use REGEX to flatten `OR` conditions.
          - Wrong: `status="200" OR status="500"`
          - Correct: `status = monitoring.regex.full_match("200|500")`
        - **Benefit**: This treats the logic as a single condition, preventing the syntax error.

    ------------------------------------------------------------------
    JSON OUTPUT RULES
    ------------------------------------------------------------------
    1. **Valid JSON**: Return a raw JSON object. Keys = filenames.
    2. **Heredoc Escaping**:
       - Because you are using Heredoc (`<<-EOT`), you only need to escape the string for JSON.
       - You do NOT need triple-escaped quotes inside the filter string itself.
    3. **Regex Backslashes**: Double escape them (`\\\\d`).

    OUTPUT FORMAT:
    {{
        "provider.tf": "...",
        "variables.tf": "...",
        "metrics.tf": "...",
        "main.tf": "...",
        "slos.tf": "..."
    }}
    """
    return prompt
