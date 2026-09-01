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
try:
    import urllib3.contrib.pyopenssl
    # 1. Revert urllib3 back to standard library ssl.SSLContext
    urllib3.contrib.pyopenssl.extract_from_urllib3()
    # 2. Permanently neutralize re-injection by google-auth / requests
    urllib3.contrib.pyopenssl.inject_into_urllib3 = lambda *args, **kwargs: None
except Exception:
    pass

from agent_eval.sdk import EvaluationResult, run_evaluation, run_evaluation_sync

__all__ = [
    "EvaluationResult",
    "run_evaluation",
    "run_evaluation_sync",
]
