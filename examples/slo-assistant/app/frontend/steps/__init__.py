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

"""UI Step definitions for the SRE Copilot application."""

from .cuj_ui import render_step2_cujs
from .diagrams_ui import render_step3_diagrams
from .repo_ui import render_step1_repo
from .slos_ui import render_step4_slos
from .terraform_ui import render_step5_terraform
