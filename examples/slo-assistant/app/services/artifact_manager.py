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

"""
Provides a centralized mapping between artifact types and their representation
in the application state. This decouples the UI components from the underlying
state structure.
"""

import json
from typing import Any, Dict, List, Optional


class ArtifactManager:
    """
    A static class that acts as a central source of truth for handling artifact
    configurations. It provides a layer of abstraction between the application's
    state keys and the UI/business logic that needs to access them.
    """

    # Defines the mapping from a logical artifact type to its key in the AgentState
    # and other metadata.
    CONFIG = {
        "sequence_diagram": {"state_key": "sequence_diagram_code"},
        "SLO": {"state_key": "slo_reports_dict"},
        "terraform": {"state_key": "terraform_files"},
        "cuj_list": {"state_key": "identified_cujs"},
    }

    @classmethod
    def get_dict_key(cls, artifact_type: str) -> Optional[str]:
        """Returns the specific key used in the AgentState for a given artifact type."""
        return cls.CONFIG.get(artifact_type, {}).get("state_key")

    @classmethod
    def get_content(
        cls, ctx: Dict[str, Any], artifact_type: str, target_name: Optional[str] = None
    ) -> Any:
        """
        Standardized getter to retrieve artifact content from the state.

        For 'cuj_list', it returns the entire list as a JSON string.
        For other types, it returns the content for a specific target (e.g., a CUJ name).
        """
        dict_key = cls.get_dict_key(artifact_type)
        if not dict_key:
            return None

        if artifact_type == "cuj_list":
            data = ctx.get(dict_key, [])
            return json.dumps(data, indent=2)

        # For dictionary-based artifacts (diagrams, SLOs, etc.)
        return ctx.get(dict_key, {}).get(target_name)

    @classmethod
    def get_all_targets(cls, ctx: Dict[str, Any], artifact_type: str) -> List[str]:
        """
        Returns a list of all editable target names for a given artifact type.
        For example, for sequence diagrams, this would be a list of CUJ names.
        """
        dict_key = cls.get_dict_key(artifact_type)
        if not dict_key or artifact_type == "cuj_list":
            return []

        return list(ctx.get(dict_key, {}).keys())
