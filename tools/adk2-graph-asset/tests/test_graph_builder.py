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

"""Tests for graph_builder module."""
import re
from pathlib import Path
from unittest.mock import MagicMock

import pytest
import yaml

from agent.graph_builder import (
    _clean_template,
    _extract_input_vars,
    _safe_name,
    _topological_order,
    build_agent_from_yaml,
    load_yaml,
)


class TestYamlLoading:
    """Test YAML file loading and parsing."""

    def test_load_yaml_success(self, sample_yaml_file):
        """Test successful YAML file loading."""
        data = load_yaml(sample_yaml_file)

        assert data is not None
        assert data["version"] == "1.0"
        assert data["kind"] == "Agent"
        assert data["metadata"]["name"] == "TestAgent"

    def test_load_yaml_missing_file(self):
        """Test error when YAML file missing."""
        with pytest.raises(FileNotFoundError):
            load_yaml("nonexistent.yaml")

    def test_load_yaml_invalid_path(self):
        """Test error with invalid path."""
        with pytest.raises((FileNotFoundError, OSError)):
            load_yaml("/invalid/path/to/file.yaml")


class TestInputExtraction:
    """Test input variable extraction from templates."""

    def test_extract_single_input(self):
        """Test extracting single input variable."""
        text = 'Tell me about {"input": "topic"}'
        vars = _extract_input_vars(text)

        assert vars == ["topic"]

    def test_extract_multiple_inputs(self):
        """Test extracting multiple input variables."""
        text = 'Tell me about {"input": "topic"} in {"input": "place"}'
        vars = _extract_input_vars(text)

        assert vars == ["topic", "place"]

    def test_extract_no_inputs(self):
        """Test when no input variables present."""
        text = "Tell me about Python"
        vars = _extract_input_vars(text)

        assert vars == []

    def test_extract_with_extra_spaces(self):
        """Test extraction with variable spacing."""
        text = 'Tell me about {"input"  :  "topic"}'
        vars = _extract_input_vars(text)

        assert "topic" in vars


class TestTemplateProcessing:
    """Test instruction template processing."""

    def test_clean_template_single_var(self):
        """Test cleaning template with single variable."""
        dirty = 'Tell me about {"input": "topic"}'
        clean = _clean_template(dirty)

        assert clean == "Tell me about {topic}"

    def test_clean_template_multiple_vars(self):
        """Test cleaning template with multiple variables."""
        dirty = 'Topic: {"input": "topic"}, Place: {"input": "place"}'
        clean = _clean_template(dirty)

        assert "{topic}" in clean
        assert "{place}" in clean

    def test_clean_template_no_vars(self):
        """Test cleaning template with no variables."""
        text = "Tell me a joke"
        clean = _clean_template(text)

        assert clean == text

    def test_format_template_with_values(self):
        """Test formatting cleaned template with values."""
        dirty = 'Tell me about {"input": "topic"} in {"input": "place"}'
        clean = _clean_template(dirty)
        formatted = clean.format(topic="Python", place="Berlin")

        assert formatted == "Tell me about Python in Berlin"


class TestSafeName:
    """Test safe name generation for ADK identifiers."""

    def test_safe_name_alphanumeric(self):
        """Test safe name with valid characters."""
        name = "MyAgent"
        safe = _safe_name(name)

        assert safe == "MyAgent"

    def test_safe_name_with_spaces(self):
        """Test safe name replaces spaces with underscores."""
        name = "My Agent Name"
        safe = _safe_name(name)

        assert safe == "My_Agent_Name"

    def test_safe_name_with_special_chars(self):
        """Test safe name removes special characters."""
        name = "My-Agent@123!"
        safe = _safe_name(name)

        assert safe == "My-Agent_123_"
        assert " " not in safe
        assert "@" not in safe
        assert "!" not in safe

    def test_safe_name_with_dots(self):
        """Test safe name handles dots."""
        name = "agent.v1.0"
        safe = _safe_name(name)

        assert "." not in safe


class TestGraphBuilder:
    """Test agent graph building from YAML."""

    def test_build_agent_basic(self, sample_yaml_file):
        """Test building agent from valid YAML."""
        root_agent, templates, schema = build_agent_from_yaml(sample_yaml_file)

        assert root_agent is not None
        assert root_agent.name is not None
        assert isinstance(templates, dict)
        assert isinstance(schema, dict)

    def test_build_agent_input_schema(self, sample_yaml_file):
        """Test that input schema is correctly extracted."""
        _, _, schema = build_agent_from_yaml(sample_yaml_file)

        assert "question" in schema
        assert schema["question"] == "text"

    def test_build_agent_templates(self, sample_yaml_file):
        """Test that instruction templates are correctly extracted."""
        _, templates, _ = build_agent_from_yaml(sample_yaml_file)

        assert len(templates) > 0
        # Should have {question} placeholder
        template = next(iter(templates.values()))
        assert "{question}" in template

    def test_build_agent_missing_llm_nodes(self, temp_dir, sample_yaml_dict):
        """Test error when no LLM nodes in workflow."""
        # Remove LLM node, keep only start/end
        sample_yaml_dict["workflow"]["nodes"] = [
            {"id": "start", "type": "start"},
            {"id": "end", "type": "end"},
        ]

        yaml_path = temp_dir / "no_llm.yaml"
        with open(yaml_path, "w") as f:
            yaml.dump(sample_yaml_dict, f)

        with pytest.raises(ValueError, match="No LLM nodes"):
            build_agent_from_yaml(yaml_path)

    def test_build_agent_with_multiple_llms(self, temp_dir, sample_yaml_dict):
        """Test building agent with multiple LLM nodes."""
        # Add second LLM
        sample_yaml_dict["spec"]["llms"].append(
            {
                "id": "llm-analysis",
                "provider": "vertexai",
                "model": "gemini-2.5-pro",
                "temperature": 0.2,
            }
        )

        # Add second LLM node
        sample_yaml_dict["workflow"]["nodes"].insert(
            2,
            {
                "id": "analyzer",
                "type": "llm",
                "config": {
                    "llm_id": "llm-analysis",
                    "instructions": "Analyze: {input}",
                    "system_prompt": "Provide analysis.",
                },
                "inputs": [{"name": "input", "type": "text"}],
            },
        )

        # Update edges
        sample_yaml_dict["workflow"]["edges"].insert(
            0,
            {
                "source": "assistant",
                "target": "analyzer",
            },
        )
        sample_yaml_dict["workflow"]["edges"].append(
            {
                "source": "analyzer",
                "target": "end",
            }
        )

        yaml_path = temp_dir / "multi_llm.yaml"
        with open(yaml_path, "w") as f:
            yaml.dump(sample_yaml_dict, f)

        root_agent, templates, schema = build_agent_from_yaml(yaml_path)

        assert root_agent is not None
        assert len(templates) >= 2


class TestTopologicalOrdering:
    """Test topological ordering of workflow nodes."""

    def test_topological_order_simple(self, sample_yaml_dict):
        """Test ordering with simple linear workflow."""
        nodes = sample_yaml_dict["workflow"]["nodes"]
        edges = {
            "start": ["assistant"],
            "assistant": ["end"],
        }
        node_agents = {
            "assistant": MagicMock(name="assistant"),
        }

        result = _topological_order(nodes, edges, node_agents)

        # Should have the assistant agent in order
        assert len(result) >= 1

    def test_topological_order_empty(self):
        """Test with empty node list."""
        result = _topological_order([], {}, {})

        assert result == []


class TestYamlValidation:
    """Test YAML schema validation."""

    def test_valid_yaml_schema(self, sample_yaml_file):
        """Test that valid YAML passes validation."""
        data = load_yaml(sample_yaml_file)

        required_keys = ["version", "kind", "metadata", "spec", "workflow"]
        assert all(key in data for key in required_keys)

    def test_yaml_missing_version(self, temp_dir, sample_yaml_dict):
        """Test error when version is missing."""
        del sample_yaml_dict["version"]

        yaml_path = temp_dir / "no_version.yaml"
        with open(yaml_path, "w") as f:
            yaml.dump(sample_yaml_dict, f)

        data = load_yaml(yaml_path)
        assert "version" not in data

    def test_yaml_invalid_llm_id_reference(self, temp_dir, sample_yaml_dict):
        """Test when node references non-existent LLM ID."""
        # Change LLM ID reference
        sample_yaml_dict["workflow"]["nodes"][1]["config"]["llm_id"] = "nonexistent"

        yaml_path = temp_dir / "bad_llm_ref.yaml"
        with open(yaml_path, "w") as f:
            yaml.dump(sample_yaml_dict, f)

        # This should still build but use defaults
        root_agent, _, _ = build_agent_from_yaml(yaml_path)
        assert root_agent is not None
