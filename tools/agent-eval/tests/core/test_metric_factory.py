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
"""Tests for metric_factory.py."""

import tempfile
from pathlib import Path

import pytest

from agent_eval.core import metric_factory


# Helper classes to bypass isinstance checks with Mock objects in tests
class RealLLMMetric:
    def __init__(self, name, prompt_template):
        self.name = name
        self.prompt_template = prompt_template


class RealMetric:
    def __init__(self, name, custom_function=None, remote_custom_function=None):
        self.name = name
        self.custom_function = custom_function
        self.remote_custom_function = remote_custom_function


def patch_vt_types(monkeypatch, vt):
    monkeypatch.setattr(vt, "LLMMetric", RealLLMMetric)
    monkeypatch.setattr(vt, "Metric", RealMetric)


def test_build_custom_llm_judge_with_rubric():
    # We need to get the mock vt
    vt = metric_factory._vt()
    vt.LLMMetric.reset_mock()
    vt.MetricPromptBuilder.reset_mock()

    spec = {
        "kind": "custom_llm_judge",
        "instruction": "Test instruction",
        "criteria": {"only": "test criterion"},
        "rating_scores": {"1": "Pass", "0": "Fail"},
    }

    metric_factory.build_metric("test_metric", spec)

    vt.MetricPromptBuilder.assert_called_once_with(
        criteria={"only": "test criterion"},
        rating_scores={"1": "Pass", "0": "Fail"},
        instruction="Test instruction",
    )
    vt.LLMMetric.assert_called_once_with(
        name="test_metric", prompt_template=vt.MetricPromptBuilder.return_value
    )


def test_build_custom_llm_judge_with_prompt_template():
    vt = metric_factory._vt()
    vt.LLMMetric.reset_mock()
    vt.MetricPromptBuilder.reset_mock()

    spec = {
        "kind": "custom_llm_judge",
        "prompt_template": "Custom prompt: {response}",
    }

    metric_factory.build_metric("test_metric2", spec)

    vt.MetricPromptBuilder.assert_not_called()
    vt.LLMMetric.assert_called_once_with(
        name="test_metric2", prompt_template="Custom prompt: {response}"
    )


def test_build_custom_llm_judge_missing_required():
    spec = {
        "kind": "custom_llm_judge",
        "instruction": "Test instruction",
    }

    with pytest.raises(ValueError, match=r"prompt_template.*or.*criteria.*required"):
        metric_factory.build_metric("test_metric_fail", spec)


def test_build_managed_metric():
    vt = metric_factory._vt()
    vt.RubricMetric.GENERAL_QUALITY.reset_mock()

    spec = {"kind": "managed", "base": "GENERAL_QUALITY"}
    metric = metric_factory.build_metric("my_managed", spec)
    assert metric == vt.RubricMetric.GENERAL_QUALITY


def test_build_parametrized_managed_metric():
    vt = metric_factory._vt()
    vt.RubricMetric.GENERAL_QUALITY.reset_mock()

    spec = {
        "kind": "parametrized_managed",
        "base": "GENERAL_QUALITY",
        "guidelines": "Test guidelines",
        "version": "v2",
    }
    metric_factory.build_metric("my_param_managed", spec)
    vt.RubricMetric.GENERAL_QUALITY.assert_called_once_with(
        metric_spec_parameters={"guidelines": "Test guidelines"},
        version="v2",
    )


def test_build_computation_metric():
    vt = metric_factory._vt()
    vt.Metric.reset_mock()

    spec = {"kind": "computation", "metric_name": "exact_match"}
    metric_factory.build_metric("my_comp", spec)
    vt.Metric.assert_called_once_with(name="my_comp", metric_name="exact_match")


def test_build_remote_code_metric():
    vt = metric_factory._vt()
    vt.Metric.reset_mock()

    spec = {
        "kind": "remote_code",
        "code_snippet": "def evaluate(instance): return {'score': 1.0}",
    }
    metric_factory.build_metric("my_remote", spec)
    vt.Metric.assert_called_once_with(
        name="my_remote",
        remote_custom_function="def evaluate(instance): return {'score': 1.0}",
    )


def test_build_python_function_metric():
    vt = metric_factory._vt()
    vt.Metric.reset_mock()

    with tempfile.NamedTemporaryFile(suffix=".py", mode="w", delete=False) as f:
        f.write("def dummy_fn(row): return {'score': 1.0}\n")
        temp_path = Path(f.name)

    try:
        spec = {
            "kind": "python_function",
            "module": str(temp_path),
            "function": "dummy_fn",
        }
        metric_factory.build_metric("my_fn", spec)
        vt.Metric.assert_called_once()
        _args, kwargs = vt.Metric.call_args
        assert kwargs["name"] == "my_fn"
        assert callable(kwargs["custom_function"])
        assert kwargs["custom_function"]({"row": "dummy"}) == {"score": 1.0}
    finally:
        temp_path.unlink()


# --- Validation Tests ---


def test_validate_custom_llm_judge_with_rubric():
    from agent_eval.core.metric_generator import _validate_single_metric

    defn = {
        "kind": "custom_llm_judge",
        "criteria": {"only": "test criterion"},
        "rating_scores": {"1": "Pass", "0": "Fail"},
    }
    errors = _validate_single_metric("test_metric", defn)
    assert not errors


def test_validate_custom_llm_judge_with_prompt_template():
    from agent_eval.core.metric_generator import _validate_single_metric

    defn = {
        "kind": "custom_llm_judge",
        "prompt_template": "Custom prompt: {response}",
    }
    errors = _validate_single_metric("test_metric", defn)
    assert not errors


def test_validate_custom_llm_judge_missing_both():
    from agent_eval.core.metric_generator import _validate_single_metric

    defn = {
        "kind": "custom_llm_judge",
        "instruction": "Test instruction",
    }
    errors = _validate_single_metric("test_metric", defn)
    assert any(
        "must provide 'prompt_template' or both 'criteria' and 'rating_scores'" in e
        for e in errors
    )


def test_validate_metric_with_state_mapping():
    from agent_eval.core.metric_generator import _validate_single_metric

    defn = {
        "kind": "custom_llm_judge",
        "prompt_template": "Custom prompt: {state_val}",
        "dataset_mapping": {
            "state_val": {"source_column": "final_session_state:state.my_var"}
        },
    }
    errors = _validate_single_metric("test_metric_state", defn)
    assert not errors


def test_validate_managed_missing_base():
    from agent_eval.core.metric_generator import _validate_single_metric

    defn = {"kind": "managed"}
    errors = _validate_single_metric("test_metric", defn)
    assert any("missing required field" in e and "base" in e for e in errors)


def test_validate_computation_missing_metric_name():
    from agent_eval.core.metric_generator import _validate_single_metric

    defn = {"kind": "computation"}
    errors = _validate_single_metric("test_metric", defn)
    assert any("missing required field" in e and "metric_name" in e for e in errors)


def test_validate_python_function_missing_fields():
    from agent_eval.core.metric_generator import _validate_single_metric

    defn = {"kind": "python_function", "module": "foo.py"}
    errors = _validate_single_metric("test_metric", defn)
    assert any("missing required field" in e and "function" in e for e in errors)


def test_validate_remote_code_missing_snippet():
    from agent_eval.core.metric_generator import _validate_single_metric

    defn = {"kind": "remote_code"}
    errors = _validate_single_metric("test_metric", defn)
    assert any("missing required field" in e and "code_snippet" in e for e in errors)


# --- to_evaluation_run_metric Tests ---


def test_to_evaluation_run_metric_prebuilt():
    from agent_eval.core.metric_factory import to_evaluation_run_metric

    class LazyLoadedPrebuiltMetric:
        def __init__(self, name):
            self.name = name

    metric = LazyLoadedPrebuiltMetric("GENERAL_QUALITY")
    res = to_evaluation_run_metric(metric)

    vt = metric_factory._vt()
    assert res == vt.EvaluationRunMetric.return_value
    vt.EvaluationRunMetric.assert_called_once_with(metric="GENERAL_QUALITY")


def test_to_evaluation_run_metric_llm(monkeypatch):
    from agent_eval.core.metric_factory import to_evaluation_run_metric

    vt = metric_factory._vt()
    patch_vt_types(monkeypatch, vt)
    vt.EvaluationRunMetric.reset_mock()
    vt.UnifiedMetric.reset_mock()
    vt.LLMBasedMetricSpec.reset_mock()

    metric = RealLLMMetric("custom_metric", "template")
    res = to_evaluation_run_metric(metric)

    assert res == vt.EvaluationRunMetric.return_value
    vt.EvaluationRunMetric.assert_called_once()
    _args, kwargs = vt.EvaluationRunMetric.call_args
    assert kwargs["metric"] == "custom_metric"
    assert kwargs["metric_config"] == vt.UnifiedMetric.return_value

    vt.UnifiedMetric.assert_called_once()
    _, u_kwargs = vt.UnifiedMetric.call_args
    assert u_kwargs["llm_based_metric_spec"] == vt.LLMBasedMetricSpec.return_value
    vt.LLMBasedMetricSpec.assert_called_once_with(metric_prompt_template="template")


def test_to_evaluation_run_metric_remote_code(monkeypatch):
    from agent_eval.core.metric_factory import to_evaluation_run_metric

    vt = metric_factory._vt()
    patch_vt_types(monkeypatch, vt)
    vt.EvaluationRunMetric.reset_mock()
    vt.UnifiedMetric.reset_mock()
    vt.CustomCodeExecutionSpec.reset_mock()

    metric = RealMetric("custom_remote", remote_custom_function="code")
    res = to_evaluation_run_metric(metric)

    assert res == vt.EvaluationRunMetric.return_value
    vt.EvaluationRunMetric.assert_called_once()
    _args, kwargs = vt.EvaluationRunMetric.call_args
    assert kwargs["metric"] == "custom_remote"
    assert kwargs["metric_config"] == vt.UnifiedMetric.return_value

    vt.UnifiedMetric.assert_called_once()
    _, u_kwargs = vt.UnifiedMetric.call_args
    assert (
        u_kwargs["custom_code_execution_spec"]
        == vt.CustomCodeExecutionSpec.return_value
    )
    vt.CustomCodeExecutionSpec.assert_called_once_with(remote_custom_function="code")


def test_to_evaluation_run_metric_local_function_fails(monkeypatch):
    from agent_eval.core.metric_factory import to_evaluation_run_metric

    vt = metric_factory._vt()
    patch_vt_types(monkeypatch, vt)

    metric = RealMetric("custom_local", custom_function=lambda x: x)
    with pytest.raises(ValueError, match="local Python function and cannot run"):
        to_evaluation_run_metric(metric)


def test_to_evaluation_run_metric_invalid_type(monkeypatch):
    from agent_eval.core.metric_factory import to_evaluation_run_metric

    vt = metric_factory._vt()
    patch_vt_types(monkeypatch, vt)

    with pytest.raises(TypeError, match="Cannot wrap metric of type"):
        to_evaluation_run_metric("invalid_string_metric")
