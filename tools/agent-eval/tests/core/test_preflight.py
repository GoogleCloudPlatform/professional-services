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
"""Regression tests for the startup dependency check.

Installing agent-eval into the *agent's* own virtualenv means a later
``uv sync`` in that project re-resolves against the agent's lockfile and
downgrades a shared package underneath us. That used to surface as
``ModuleNotFoundError: No module named 'google.adk.workflow'`` from deep inside
an import chain — an error that points nowhere near the cause.
"""

from importlib.metadata import PackageNotFoundError

import pytest
from packaging.specifiers import SpecifierSet

from agent_eval import _preflight
from agent_eval._preflight import DependencyMismatchError, check_runtime_dependencies

DECLARED = {
    "google-adk": SpecifierSet(">=2.0.0,<3.0.0"),
    "google-cloud-aiplatform": SpecifierSet(">=1.132.0,<2.0.0"),
}


@pytest.fixture
def declared(monkeypatch):
    monkeypatch.setattr(_preflight, "_declared_specifiers", lambda: DECLARED)


def _versions(monkeypatch, mapping):

    def fake_version(name):
        if name not in mapping:
            raise PackageNotFoundError(name)
        return mapping[name]

    monkeypatch.setattr(_preflight, "version", fake_version)


def test_in_range_versions_pass_silently(declared, monkeypatch):
    _versions(monkeypatch, {
        "google-adk": "2.5.0",
        "google-cloud-aiplatform": "1.162.0"
    })
    check_runtime_dependencies()  # must not raise


def test_downgraded_adk_is_reported(declared, monkeypatch):
    _versions(monkeypatch, {
        "google-adk": "1.28.0",
        "google-cloud-aiplatform": "1.162.0"
    })
    with pytest.raises(DependencyMismatchError) as err:
        check_runtime_dependencies()
    message = str(err.value)
    assert "google-adk" in message
    assert "1.28.0" in message
    # The message must point at the cause, not just the symptom.
    assert "virtualenv" in message
    assert ".venv-eval" in message


def test_missing_package_is_reported(declared, monkeypatch):
    _versions(monkeypatch, {"google-cloud-aiplatform": "1.162.0"})
    with pytest.raises(DependencyMismatchError, match="not installed"):
        check_runtime_dependencies()


def test_every_out_of_range_package_is_listed(declared, monkeypatch):
    _versions(monkeypatch, {
        "google-adk": "1.28.0",
        "google-cloud-aiplatform": "2.5.0"
    })
    with pytest.raises(DependencyMismatchError) as err:
        check_runtime_dependencies()
    message = str(err.value)
    assert "google-adk" in message
    assert "google-cloud-aiplatform" in message


def test_prerelease_within_range_is_accepted(declared, monkeypatch):
    _versions(monkeypatch, {
        "google-adk": "2.6.0rc1",
        "google-cloud-aiplatform": "1.162.0"
    })
    check_runtime_dependencies()  # must not raise


def test_check_disabled_when_metadata_unavailable(monkeypatch):
    # A source checkout without installed metadata: better to skip than guess.
    monkeypatch.setattr(_preflight, "_declared_specifiers", dict)
    check_runtime_dependencies()  # must not raise


def test_declared_specifiers_reads_our_own_metadata():
    # Guards against the check silently disabling itself if packaging metadata
    # or the distribution name changes.
    found = _preflight._declared_specifiers()
    assert set(found) == {"google-adk", "google-cloud-aiplatform"}


def test_missing_packaging_disables_check_instead_of_crashing(monkeypatch):
    # A dependency-free install must not turn the safety check into the failure.
    import builtins

    real_import = builtins.__import__

    def no_packaging(name, *args, **kwargs):
        if name.startswith("packaging"):
            raise ImportError("No module named 'packaging'")
        return real_import(name, *args, **kwargs)

    monkeypatch.setattr(builtins, "__import__", no_packaging)
    assert _preflight._declared_specifiers() == {}
    check_runtime_dependencies()  # must not raise
