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
import textwrap

import pytest

from schema_evolution import ConfigError, filter_targets, load_config, parse_config

SCHEMA = {"type": "object", "properties": {"title": {"type": "string"}}}


@pytest.fixture
def workdir(tmp_path):
    (tmp_path / "schemas").mkdir()
    (tmp_path / "schemas" / "a.json").write_text(json.dumps(SCHEMA))
    (tmp_path / "schemas" / "b.json").write_text(json.dumps({"x_schema": {"struct_schema": SCHEMA}}))
    return tmp_path


def write(workdir, text, name="config.yaml"):
    path = workdir / name
    path.write_text(textwrap.dedent(text))
    return path


def test_full_config_with_precedence(workdir):
    path = write(workdir, """
        defaults:
          location: us
          on_breaking: raise
        projects:
          - project_id: proj-a
            operation_timeout: 600
            datastores:
              - datastore_id: ds1
                schema_file: schemas/a.json
              - datastore_id: ds2
                schema_file: schemas/b.json
                schema_key: [missing_schema, x_schema]
                on_breaking: skip
              - datastore_id: ds3
                schema_file: schemas/a.json
                enabled: false
          - project_id: proj-b
            location: global
            datastores:
              - datastore_id: ds1
                schema_file: schemas/a.json
    """)
    targets = load_config(path)
    assert [t.label for t in targets] == ["proj-a/us/ds1", "proj-a/us/ds2", "proj-b/global/ds1"]
    ds1, ds2, b1 = targets
    assert ds1.options == {"location": "us", "on_breaking": "raise", "operation_timeout": 600}
    assert ds2.options["on_breaking"] == "skip" and ds2.schema_key == ["missing_schema", "x_schema"]
    assert b1.options["location"] == "global"
    assert ds1.schema_file == (workdir / "schemas" / "a.json").resolve()


def test_json_config_and_location_default(workdir):
    path = write(workdir, json.dumps(
        {"projects": [{"project_id": "p", "datastores": [{"datastore_id": "d", "schema_file": "schemas/a.json"}]}]}
    ), name="config.json")
    [target] = load_config(path)
    assert target.location == "global"


def test_env_var_expansion(workdir, monkeypatch):
    monkeypatch.setenv("DEV_PROJECT", "dev-123")
    path = write(workdir, """
        projects:
          - project_id: ${DEV_PROJECT}
            datastores: [{datastore_id: d, schema_file: schemas/a.json}]
    """)
    assert load_config(path)[0].project_id == "dev-123"


def test_unset_env_var_is_reported(workdir, monkeypatch):
    monkeypatch.delenv("NOT_SET_VAR", raising=False)
    path = write(workdir, """
        projects:
          - project_id: ${NOT_SET_VAR}
            datastores: [{datastore_id: d, schema_file: schemas/a.json}]
    """)
    with pytest.raises(ConfigError, match="unset environment variable"):
        load_config(path)


def test_all_errors_reported_together(workdir):
    path = write(workdir, """
        defaults:
          locaton: us
        projects:
          - project_id: p
            datastores:
              - datastore_id: d1
                schema_file: schemas/missing.json
              - datastore_id: d2
              - schema_file: schemas/a.json
              - datastore_id: d3
                schema_file: schemas/a.json
                on_breaking: 5
                recreate_if_empty: "yes"
              - datastore_id: d4
                schema_file: schemas/a.json
                schema_key: ""
          - datastores: []
    """)
    with pytest.raises(ConfigError) as exc:
        load_config(path)
    message = str(exc.value)
    for expected in [
        "unknown key(s) ['locaton']",
        "schema_file not found",
        "datastores[d2].schema_file is required",
        "datastore_id is required",
        "on_breaking has an invalid value",
        "recreate_if_empty has an invalid value",
        "schema_key must be",
        "project_id is required",
    ]:
        assert expected in message


def test_duplicate_datastore_rejected(workdir):
    path = write(workdir, """
        projects:
          - project_id: p
            datastores:
              - {datastore_id: d, schema_file: schemas/a.json}
              - {datastore_id: d, schema_file: schemas/b.json}
    """)
    with pytest.raises(ConfigError, match="duplicates"):
        load_config(path)


@pytest.mark.parametrize(
    "text, msg",
    [
        ("", "mapping"),
        ("- a\n- b\n", "mapping"),
        ("projects: []\n", "non-empty list"),
        ("projects:\n  - project_id: p\n    datastores: [{datastore_id: d, schema_file: schemas/a.json, enabled: false}]\n",
         "no enabled datastores"),
        ("projects: [\n", "Malformed YAML"),
        ("projects:\n  - project_id: p\n    datastores: [{datastore_id: d, schema_file: schemas/a.json, max_attempts: true}]\n",
         "max_attempts has an invalid value"),
    ],
)
def test_bad_configs(workdir, text, msg):
    with pytest.raises(ConfigError, match=msg):
        load_config(write(workdir, text))


def test_missing_config_file(tmp_path):
    with pytest.raises(ConfigError, match="not found"):
        load_config(tmp_path / "nope.yaml")


def test_yaml_safe_load_blocks_python_objects(workdir):
    with pytest.raises(ConfigError, match="Malformed YAML"):
        load_config(write(workdir, "projects: !!python/object/apply:os.system ['echo hi']\n"))


def test_filters(workdir):
    targets = parse_config(
        {"projects": [
            {"project_id": "p1", "datastores": [{"datastore_id": "a", "schema_file": "schemas/a.json"},
                                                 {"datastore_id": "b", "schema_file": "schemas/a.json"}]},
            {"project_id": "p2", "datastores": [{"datastore_id": "a", "schema_file": "schemas/a.json"}]},
        ]},
        base_dir=workdir,
    )
    assert len(filter_targets(targets)) == 3
    assert [t.label for t in filter_targets(targets, projects=["p1"], datastores=["b"])] == ["p1/global/b"]
    with pytest.raises(ConfigError, match="No datastores match"):
        filter_targets(targets, projects=["nope"])
