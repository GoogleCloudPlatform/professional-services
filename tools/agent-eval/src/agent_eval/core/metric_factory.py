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
"""Build SDK metric objects from the unified metric_definitions.json schema.

Supports the five custom-metric patterns documented at
https://docs.cloud.google.com/vertex-ai/generative-ai/docs/models/determine-eval

Unified schema (per ``tests/eval/metrics/metric_definitions.json`` entry):

.. code-block:: jsonc

    {
      "<metric_name>": {
        "kind": "managed" | "parametrized_managed" | "custom_llm_judge"
              | "python_function" | "remote_code",

        // managed / parametrized_managed
        "base": "general_quality",      // RubricMetric attribute (case-insensitive)
        "version": "v1",                // optional, e.g. "v1", "v2"
        "guidelines": "...",            // parametrized_managed only

        // custom_llm_judge
        "instruction": "...",           // optional, builder default kicks in
        "criteria": {"name": "def"},
        "rating_scores": {"5": "...", "1": "..."},

        // python_function
        "module": "tests/eval/custom_metrics.py",
        "function": "contains_keyword",

        // remote_code
        "code_snippet": "def evaluate(instance): ..."
      }
    }
"""

from __future__ import annotations

import importlib.util
import logging
from pathlib import Path
from typing import Any, Callable, Dict, List, Tuple

logger = logging.getLogger("agent_eval")


def _vt():
    """Lazily import vertexai.types so the module imports without the SDK."""
    from vertexai import types as vt

    return vt


# ---------------------------------------------------------------------------
# Builders for the five custom metric patterns
# ---------------------------------------------------------------------------


def parametrized_managed(
    base: str,
    *,
    guidelines: str | None = None,
    version: str | None = None,
    rubric_groups: dict | None = None,
):
    """Wrap a managed RubricMetric with optional guidelines/version overrides.

    Mirrors the doc snippet:
        types.RubricMetric.GENERAL_QUALITY(metric_spec_parameters={"guidelines": "..."})
    """
    vt = _vt()
    attr = base.upper()
    rubric = getattr(vt.RubricMetric, attr, None)
    if rubric is None:
        raise ValueError(
            f"Unknown managed metric base '{base}'. "
            f"Must be a RubricMetric attribute name."
        )

    kwargs: Dict[str, Any] = {}
    if version:
        kwargs["version"] = version
    spec_params: Dict[str, Any] = {}
    if guidelines:
        spec_params["guidelines"] = guidelines
    if rubric_groups:
        spec_params["rubric_groups"] = rubric_groups
    if spec_params:
        kwargs["metric_spec_parameters"] = spec_params

    return rubric(**kwargs) if kwargs else rubric


def custom_llm_judge(
    name: str,
    *,
    criteria: Dict[str, str],
    rating_scores: Dict[str, str],
    instruction: str | None = None,
):
    """Build a fully-custom LLM judge as ``types.LLMMetric``."""
    vt = _vt()
    builder_kwargs: Dict[str, Any] = {
        "criteria": criteria,
        "rating_scores": rating_scores,
    }
    if instruction:
        builder_kwargs["instruction"] = instruction
    return vt.LLMMetric(
        name=name,
        prompt_template=vt.MetricPromptBuilder(**builder_kwargs),
    )


def python_function(name: str, fn: Callable[[Dict[str, Any]], Dict[str, Any]]):
    """Wrap a deterministic Python function as ``types.Metric``."""
    vt = _vt()
    return vt.Metric(name=name, custom_function=fn)


def remote_code(name: str, code_snippet: str):
    """Wrap a remote/sandboxed code execution metric as ``types.Metric``."""
    vt = _vt()
    return vt.Metric(name=name, remote_custom_function=code_snippet)


def computation(name: str, metric_name: str):
    """Wrap a built-in computation metric as ``types.Metric``.

    Per docs/determine-eval, ``types.Metric(name='bleu' | 'rouge_l' |
    'exact_match' | 'tool_*' | ...)`` — the SDK dispatches by name. The set
    of valid ``metric_name`` values is introspected from
    ``metric_families._supported_computation()``; we don't hardcode here.

    ``name`` is what users see in the result table (their friendly name);
    ``metric_name`` is what the SDK computes.
    """
    vt = _vt()
    return vt.Metric(name=name or metric_name, metric_name=metric_name)


# ---------------------------------------------------------------------------
# Schema-driven dispatch
# ---------------------------------------------------------------------------

# Single source of truth — see ``core/metric_schema.py``.
from agent_eval.core.metric_schema import (  # noqa: E402
    ALL_KINDS as _KNOWN_KINDS,
    KIND_MANAGED,
    KIND_PARAMETRIZED_MANAGED,
    KIND_CUSTOM_LLM_JUDGE,
    KIND_COMPUTATION,
    KIND_PYTHON_FUNCTION,
    KIND_REMOTE_CODE,
)


def _load_python_callable(module_path: str | Path, function: str) -> Callable:
    """Load a callable from an arbitrary file path."""
    module_path = Path(module_path)
    if not module_path.exists():
        raise FileNotFoundError(f"Python function module not found: {module_path}")
    spec = importlib.util.spec_from_file_location(module_path.stem, module_path)
    if spec is None or spec.loader is None:
        raise ImportError(f"Could not load module from {module_path}")
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    fn = getattr(module, function, None)
    if fn is None or not callable(fn):
        raise AttributeError(f"Function '{function}' not found in {module_path}")
    return fn


def build_metric(name: str, spec: Dict[str, Any], *, base_dir: Path | None = None):
    """Build a single SDK metric object from a canonical-schema entry.

    Six supported ``kind`` values, mirroring the docs at
    https://cloud.google.com/vertex-ai/generative-ai/docs/models/determine-eval

    Raises ``ValueError`` if ``kind`` is missing/unknown or the per-kind
    required fields aren't present. There is no back-compat for our previous
    internal ``template`` + ``score_range`` shape — the canonical schema is the
    only accepted form.
    """
    kind = (spec.get("kind") or "").lower()
    if kind not in _KNOWN_KINDS:
        raise ValueError(
            f"Metric '{name}': unknown or missing 'kind'. "
            f"Expected one of {sorted(_KNOWN_KINDS)}, got {kind!r}."
        )

    if kind in (KIND_MANAGED, KIND_PARAMETRIZED_MANAGED):
        base = spec.get("base", name)
        return parametrized_managed(
            base=base,
            guidelines=spec.get("guidelines"),
            version=spec.get("version"),
            rubric_groups=spec.get("rubric_groups"),
        )

    if kind == KIND_CUSTOM_LLM_JUDGE:
        criteria = spec.get("criteria")
        rating_scores = spec.get("rating_scores")
        if not criteria or not rating_scores:
            raise ValueError(
                f"Metric '{name}' (custom_llm_judge): both 'criteria' and "
                f"'rating_scores' are required."
            )
        return custom_llm_judge(
            name=name,
            criteria=criteria,
            rating_scores=rating_scores,
            instruction=spec.get("instruction"),
        )

    if kind == KIND_COMPUTATION:
        metric_name = spec.get("metric_name")
        if not metric_name:
            raise ValueError(
                f"Metric '{name}' (computation): 'metric_name' is required "
                f"(e.g. 'bleu', 'rouge_l', 'exact_match'). The SDK dispatches by name."
            )
        return computation(name, metric_name)

    if kind == KIND_PYTHON_FUNCTION:
        module = spec.get("module")
        function = spec.get("function")
        if not module or not function:
            raise ValueError(
                f"Metric '{name}' (python_function): 'module' and 'function' required."
            )
        module_path = Path(module)
        if base_dir and not module_path.is_absolute():
            module_path = base_dir / module_path
        fn = _load_python_callable(module_path, function)
        return python_function(name, fn)

    if kind == KIND_REMOTE_CODE:
        code = spec.get("code_snippet")
        if not code:
            raise ValueError(
                f"Metric '{name}' (remote_code): 'code_snippet' is required."
            )
        return remote_code(name, code)

    raise AssertionError("unreachable")  # pragma: no cover


def build_all(
    definitions: Dict[str, Dict[str, Any]],
    *,
    base_dir: Path | None = None,
) -> List[Tuple[str, Any]]:
    """Build all metrics from a unified definitions dict.

    Returns ``[(name, sdk_object), ...]``. Skips entries whose ``kind`` is
    missing from the known set with a logged warning.
    """
    built: List[Tuple[str, Any]] = []
    for name, spec in definitions.items():
        try:
            metric = build_metric(name, spec, base_dir=base_dir)
            built.append((name, metric))
        except Exception as exc:
            logger.warning("Failed to build metric '%s': %s", name, exc)
    return built


# ---------------------------------------------------------------------------
# Agent Engine bridge — wrap any built metric for create_evaluation_run
# ---------------------------------------------------------------------------


def to_evaluation_run_metric(metric: Any):
    """Wrap a metric for ``client.evals.create_evaluation_run``.

    ``EvaluationRunMetric.metric_config`` accepts a ``UnifiedMetric`` with one
    of six spec kinds. ``LazyLoadedPrebuiltMetric`` instances pass through
    unchanged (the SDK's ``_resolve_evaluation_run_metrics`` resolves them).
    """
    vt = _vt()

    # LazyLoaded predefined / parametrized managed: the SDK resolver handles it.
    type_name = type(metric).__name__
    if type_name == "LazyLoadedPrebuiltMetric":
        return vt.EvaluationRunMetric(metric=getattr(metric, "name", None))

    # LLMMetric -> llm_based_metric_spec
    if isinstance(metric, vt.LLMMetric):
        # The spec class moved between SDK versions: older releases exposed
        # it as ``vertexai._genai.types.LLMBasedMetricSpec``; current
        # releases re-export ``google.genai.types.LLMBasedMetricSpec``.
        try:
            spec_cls = vt.LLMBasedMetricSpec
        except AttributeError:
            from google.genai.types import LLMBasedMetricSpec as spec_cls
        return vt.EvaluationRunMetric(
            metric=metric.name,
            metric_config=vt.UnifiedMetric(
                llm_based_metric_spec=spec_cls(
                    metric_prompt_template=metric.prompt_template,
                ),
            ),
        )

    # Bare Metric with remote_custom_function -> custom_code_execution_spec
    if isinstance(metric, vt.Metric) and getattr(
        metric, "remote_custom_function", None
    ):
        return vt.EvaluationRunMetric(
            metric=metric.name,
            metric_config=vt.UnifiedMetric(
                custom_code_execution_spec=vt.CustomCodeExecutionSpec(
                    remote_custom_function=metric.remote_custom_function,
                ),
            ),
        )

    # Bare Metric with custom_function: in-process only; not supported by
    # the streamlined `agent-engine` runner. Caller must convert it to
    # remote_code or skip.
    if isinstance(metric, vt.Metric) and getattr(metric, "custom_function", None):
        raise ValueError(
            f"Metric '{metric.name}' is a local Python function and cannot run "
            f"in the streamlined Agent Engine path. Convert it to remote_code "
            f"(custom_code_execution_spec) by providing a code_snippet, or run "
            f"it via the standard `evaluate` command instead."
        )

    raise TypeError(
        f"Cannot wrap metric of type {type_name} for create_evaluation_run."
    )
