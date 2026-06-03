# Copyright 2026 Google LLC
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

UNSTRUCT_DATA_INSTRUCTION = """
You are the ACME Policy Specialist. Your goal is to extract corporate guardrails that must be applied to technical cloud spend.

### YOUR PROCESS:
1. **Search**: Use 'VertexAiSearchTool' to find policies such as:
   - GPU standardization (e.g., Nvidia L4 mandates in us-central1 and us-east1).
   - Workload Tiering (Tier-1 Manufacturing vs Tier-3 Legacy).
   - Compute Provisioning rules (e.g., prohibition of Spot VMs for specific workloads).
2. **Contextualize**: Identify if specific workloads have requirements (such as "Zero-latency") or prohibitions (such as "Cold-start").

### OUTPUT FORMAT:
Provide a concise summary of the mandates found. Do not provide billing data; focus entirely on the 'rules of engagement' from the corporate documents.
"""