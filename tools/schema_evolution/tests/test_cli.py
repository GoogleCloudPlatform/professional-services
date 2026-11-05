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

import json
from pathlib import Path

import pytest

import schema_evolution.cli as cli
import schema_evolution.runner as runner_mod
from schema_evolution import (
    Action,
    BreakingSchemaChangeError,
    ChangeType,
    EvolutionResult,
    SchemaApplyError,
    SchemaChange,
    Status,
    Target,
    run_targets,
)

TYPE_CHANGE = SchemaChange("a.type", ChangeType.TYPE_CHANGED, "number", "string")


def target(ds="ds", **options):
    options.setdefault("location", "us")
    return Target("p", ds, Path("/tmp/schema.json"), options=options)


class FakeEvolver:
    def __init__(self, outcome):
        self.outcome = outcome
        self.calls = []

    def evolve(self, schema, schema_key=None, dry_run=False):
        self.calls.append((schema, schema_key, dry_run))
        if isinstance(self.outcome, Exception):
            raise self.outcome
        return self.outcome


def factory_for(mapping):
    return lambda t: FakeEvolver(mapping[t.datastore_id])


# ---------------------------------------------------------------- runner
def test_one_failure_does_not_stop_others():
    outcomes = {
        "ok": EvolutionResult(Action.UPDATED, "s1", [SchemaChange("x", ChangeType.FIELD_ADDED)]),
        "blocked": BreakingSchemaChangeError([TYPE_CHANGE]),
        "err": SchemaApplyError("boom"),
        "crash": RuntimeError("unexpected"),
        "ok2": EvolutionResult(Action.NO_CHANGE, "s2"),
    }
    report = run_targets([target(k) for k in outcomes], evolver_factory=factory_for(outcomes))
    assert [o.status for o in report.outcomes] == [Status.OK, Status.BLOCKED, Status.ERROR, Status.ERROR, Status.OK]
    assert report.exit_code == 1 and not report.ok
    assert "Total 5 | OK 2 | BLOCKED 1 | ERROR 2" in report.summary()


def test_exit_codes():
    ok = {"a": EvolutionResult(Action.NO_CHANGE, "s")}
    assert run_targets([target("a")], evolver_factory=factory_for(ok)).exit_code == 0
    blocked = {"a": BreakingSchemaChangeError([TYPE_CHANGE])}
    assert run_targets([target("a")], evolver_factory=factory_for(blocked)).exit_code == 2


def test_fail_fast_marks_rest_not_run():
    outcomes = {"a": SchemaApplyError("boom"), "b": EvolutionResult(Action.NO_CHANGE, "s")}
    report = run_targets([target("a"), target("b")], fail_fast=True, evolver_factory=factory_for(outcomes))
    assert [o.status for o in report.outcomes] == [Status.ERROR, Status.NOT_RUN]


def test_dry_run_with_breaking_is_blocked_unless_skip():
    dry = EvolutionResult(Action.DRY_RUN, "s", [TYPE_CHANGE])
    report = run_targets([target("a"), target("b", on_breaking="skip")], dry_run=True,
                         evolver_factory=factory_for({"a": dry, "b": dry}))
    assert [o.status for o in report.outcomes] == [Status.BLOCKED, Status.OK]
    assert report.dry_run and "(dry run)" in report.summary()


def test_arguments_passed_to_evolver_and_json_report():
    evolver = FakeEvolver(EvolutionResult(Action.CREATED, "s"))
    t = Target("p", "d", Path("/x/schema.json"), schema_key=["k1", "k2"], options={"location": "us"})
    report = run_targets([t], dry_run=True, evolver_factory=lambda _: evolver)
    assert evolver.calls == [("/x/schema.json", ["k1", "k2"], True)]
    data = report.to_dict()
    assert data["datastores"][0]["action"] == "CREATED" and data["totals"]["OK"] == 1


def test_default_factory_builds_evolver_with_options():
    t = target("d", on_breaking="skip", operation_timeout=60)
    ev = runner_mod._default_factory(t, use_cache=False)
    assert (ev.project_id, ev.location, ev.datastore_id) == ("p", "us", "d")
    assert ev.on_breaking == "skip" and ev.operation_timeout == 60 and ev.use_cache is False
    assert t.options["location"] == "us"  # target options not mutated


def test_invalid_option_becomes_error_not_crash():
    report = run_targets([target("d", on_breaking="explode")])
    assert report.outcomes[0].status is Status.ERROR and "on_breaking" in report.outcomes[0].error


# ------------------------------------------------------------------- CLI
@pytest.fixture
def config(tmp_path):
    (tmp_path / "s.json").write_text(json.dumps({"properties": {"t": {"type": "string"}}}))
    (tmp_path / "bad.json").write_text("{not json")
    path = tmp_path / "config.yaml"
    path.write_text(
        "projects:\n"
        "  - project_id: p1\n"
        "    datastores:\n"
        "      - {datastore_id: a, schema_file: s.json}\n"
        "      - {datastore_id: b, schema_file: s.json}\n"
        "  - project_id: p2\n"
        "    datastores:\n"
        "      - {datastore_id: c, schema_file: bad.json}\n"
    )
    return path


def _capture_run(monkeypatch, outcome):
    seen = {}

    def fake_run(targets, **kwargs):
        seen["targets"] = [t.label for t in targets]
        seen.update(kwargs)
        return run_targets(targets, evolver_factory=lambda t: FakeEvolver(outcome), **kwargs)

    monkeypatch.setattr(cli, "run_targets", fake_run)
    return seen


def test_cli_runs_filtered_targets(monkeypatch, config, capsys):
    seen = _capture_run(monkeypatch, EvolutionResult(Action.NO_CHANGE, "s"))
    code = cli.main(["--config", str(config), "--project", "p1", "--datastore", "b", "--dry-run", "--fail-fast"])
    assert code == 0
    assert seen["targets"] == ["p1/global/b"] and seen["dry_run"] and seen["fail_fast"]
    assert "[OK     ] p1/global/b" in capsys.readouterr().out


def test_cli_json_and_report_file(monkeypatch, config, tmp_path, capsys):
    _capture_run(monkeypatch, BreakingSchemaChangeError([TYPE_CHANGE]))
    report_file = tmp_path / "report.json"
    code = cli.main(["--config", str(config), "--project", "p1", "--json", "--report-file", str(report_file)])
    assert code == 2
    assert json.loads(capsys.readouterr().out)["totals"]["BLOCKED"] == 2
    assert json.loads(report_file.read_text())["exit_code"] == 2


def test_cli_config_error(tmp_path, capsys):
    assert cli.main(["--config", str(tmp_path / "missing.yaml")]) == 1
    assert "CONFIG ERROR" in capsys.readouterr().err


def test_cli_validate_only_is_offline(config, capsys):
    assert cli.main(["--config", str(config), "--validate-only"]) == 1
    out = capsys.readouterr().out
    assert "[VALID  ] p1/global/a" in out and "[INVALID] p2/global/c" in out
    assert cli.main(["--config", str(config), "--validate-only", "--project", "p1"]) == 0
