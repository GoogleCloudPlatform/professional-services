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

"""Prompts for generating Service Level Objective (SLO) design documents."""

SLO_TEMPLATE = """
# SLO Design Specification: [CUJ Name]

## 1. System Analysis
* **Primary Endpoint(s)**: `[METHOD] [PATH]`
* **Critical Dependencies**: [List downstream services]
* **Failure Definition**: 
    * **Availability**: [Define failure criteria]
    * **Latency**: [Define latency threshold]

## 2. Service Level Objectives

### SLO 1: [Name]

| Property | Definition |
| :--- | :--- |
| **SLI Type** | [Availability / Latency] |
| **Target** | **[e.g., 99.9%]** |
| **Window** | Rolling 28 Days |
| **Error Budget** | [Calculate budget] |

**SLI Specification:**
[Write a single, concrete sentence defining the ratio.]

$$
SLI = \\frac{ \\text{[Good Events]} }{ \\text{[Valid Events]} }
$$
            
* **Good Events**: [Precise technical definition]
* **Valid Events**: [Precise technical definition]

**Implementation Query:**

```promql
# SLI: [Name]
[INSERT QUERY]
```
"""


def get_slo_design_prompt(
    cuj_name: str, diagram_json: str, code_context: str, file_tree: str
) -> str:
    """
    Returns the prompt for drafting a Service Level Objective (SLO) design document.
    """

    filled_template = SLO_TEMPLATE.replace("[CUJ Name]", cuj_name)
    prompt = f"""
    You are a Principal SRE Architect creating a formal **Service Level Objective (SLO) Design Document** following the Google "Art of SLOs" methodology.
    
    **Objective:**
    Create a technical specification for the "{cuj_name}" Critical User Journey.
    Your audience is the Platform Engineering team who will implement these monitors using Terraform and Google Managed Prometheus.
    
    **Context:**
    This application may be running on a **Hybrid Architecture**. 
    - Some services might be on Kubernetes (GKE).
    - Others might be on Cloud Run or Compute Engine (VMs).

    INPUT DATA:
    ****1. Interaction Flow:** (MermaidJS):** The system architecture is described in these MermaidJS sequence diagrams:
    {diagram_json}
    **2. Implementation Details:** (Source Code) We are analyzing these specific implementation files:
    {code_context}
    **3. Project Structure:** (File Tree)
    {file_tree}
    
    --------------------------------------------------------
    ### **INTELLIGENT PLATFORM DETECTION (PER SERVICE)**
    You must determine the deployment platform for the **Specific Service** handling this CUJ (e.g., "Frontend" or "CheckoutService").
    
    **Detection Rules:**
    1.  **Search for Manifests:** Look through the `file_tree` for files related to this specific service name.
        - `kubernetes-manifests/<service>.yaml` OR `helm/.../<service>`  -> **Kubernetes**.
        - `src/<service>/app.yaml` OR `knative-service.yaml` -> **Cloud Run**.
    2.  **Ambiguity Handling:**
        - If BOTH K8s manifests and Cloud Run configs exist for the SAME service, assume **Kubernetes** is the primary production target.
        - If NO infrastructure files are found for the service, assume **Kubernetes** generic defaults.
    
    **PromQL Strategy (Adaptive):**
    - **IF Kubernetes:** - Use `workload.googleapis.com` metrics.
      - Labels: `namespace`, `pod`, `container`.
    - **IF Cloud Run:** - Use `run.googleapis.com` metrics.
      - Labels: `service_name`, `revision_name`.
    - **IF VM/GCE:** - Use `agent.googleapis.com` or `custom.googleapis.com` metrics.
      - Labels: `instance_id`.
      
    **Constraint:** - Explicitly state the "Detected Platform" in the output for *this specific SLO*.
    - Do NOT mix platforms in a single query (e.g. don't filter `k8s_container` by `revision_name`).
    --------------------------------------------------------

    **Style Guidelines:**
    1. **Professional & Normative:** Use imperative, technical language (e.g., "Filter by...", "Aggregate over...").
    2. **No Fluff:** Do NOT use conversational filler (e.g., "As an SRE...", "This query works by..."). 
    3. **Math:** Use LaTeX formatting for equations (e.g., $Good / Valid$).
    4. **Structure:** Follow the Output Template below exactly.
    
    
    ### **Output Template** (Do not include this header in response)
    {filled_template}
  
    ---
    
    OUTPUT: Return a clean Markdown report.
    """
    return prompt
