# 🧬 Vertex AI Search Schema Evolution Utility

A Python utility that **creates and evolves the schema of Vertex AI Search / Gemini Enterprise
datastores** from a simple config file.

You list your **projects → datastores → schema.json** in `config.yaml`. The utility then
compares each local schema with the live one and applies only the changes that are needed and
safe. Terraform does not manage datastore schemas, so this utility fills that gap.

## ✨ Features

- 📋 **Config-driven:** one YAML file for all projects, datastores and schema files.
- 🔍 **Dry run:** preview every change before applying it.
- ✅ **Writes only when needed.** Every schema update re-indexes the whole datastore, so unchanged
  schemas are never re-written.
- ➕ **Safe changes applied automatically:** new fields, annotation changes
  (`retrievable`, `indexable`, `searchable`, `dynamicFacetable`, `completable`) and `keyPropertyMapping`.
- 🛑 **Unsupported changes blocked.** Vertex AI Search cannot change a field type or remove a field.
  The utility blocks or skips type changes instead of failing halfway, and it never removes fields.
- 🧯 **Isolated failures:** one bad datastore doesn't stop the others. You get a clear report and
  CI-friendly exit codes.
- 🐍 **Also a library:** `from schema_evolution import evolve_schema` inside your own pipelines.

## 📁 Folder structure

```text
schema_evolution/
├── README.md
├── main.py                       # entry point: python3 main.py --config config.yaml
├── requirements.txt
├── config.example.yaml           # copy to config.yaml and edit
├── schemas/                      # your schema.json files
│   ├── example_schema.json
│   └── example_wrapped_schema.json
├── src/schema_evolution/         # the package
│   ├── cli.py  config.py  runner.py  evolver.py  diff.py  loader.py  models.py  exceptions.py
├── tests/
└── pyproject.toml                # optional: pip install . to get the `schema-evolution` command
```

## 🛠️ Prerequisites

1. Python **3.11+** recommended (3.9+ works, but Google client libraries warn that 3.9/3.10 are end of life)
2. The [gcloud CLI](https://cloud.google.com/sdk/docs/install), authenticated
3. The **Discovery Engine API** enabled in each target project
4. An existing Vertex AI Search **datastore**. The utility manages schemas only; it does not create datastores.
5. IAM on each datastore, for the user or service account running the utility:

| Needed for | Permissions | Simplest role |
|---|---|---|
| Normal runs | `discoveryengine.schemas.get`, `.create`, `.update` | `roles/discoveryengine.editor` |
| `recreate_if_empty: true` only | also `discoveryengine.schemas.delete`, `discoveryengine.documents.list` | `roles/discoveryengine.editor` |

## 🚀 Steps to use

### 1. Clone the repository

```bash
git clone https://github.com/GoogleCloudPlatform/professional-services.git
cd professional-services/tools/<this-tool-folder>
```

### 2. Install the dependencies

```bash
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

### 3. Authenticate with Google Cloud

```bash
gcloud auth application-default login
# or, on CI / a VM: use a service account with the permissions listed above
```

### 4. Add your schema files

Put one JSON schema per datastore in `schemas/`. Two formats are supported.

**a) Raw JSON schema** ([example](schemas/example_schema.json)):

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "type": "object",
  "properties": {
    "title": { "type": "string", "keyPropertyMapping": "title", "retrievable": true },
    "publication_date": { "type": "datetime", "indexable": true, "retrievable": true }
  }
}
```

**b) Wrapper file** with several named schemas ([example](schemas/example_wrapped_schema.json)).
Pick one with `schema_key`:

```json
{ "abstracts_schema": { "struct_schema": { "type": "object", "properties": { } } },
  "fallback_schema":  { "struct_schema": { "type": "object", "properties": { } } } }
```

### 5. Create the config: projects → datastores → schema.json

```bash
cp config.example.yaml config.yaml
```

```yaml
defaults:                         # optional, applies to every datastore
  location: us                    # global | us | eu
  on_breaking: raise              # raise | skip

projects:
  - project_id: ${DEV_PROJECT_ID} # env vars are supported
    datastores:
      - datastore_id: journals-datastore
        schema_file: schemas/example_schema.json

      - datastore_id: abstracts-datastore
        schema_file: schemas/example_wrapped_schema.json
        schema_key: [abstracts_schema, fallback_schema]   # first key found is used
        on_breaking: skip                                 # per-datastore override

  - project_id: my-prod-project
    location: global                                      # per-project override
    datastores:
      - datastore_id: journals-datastore
        schema_file: schemas/example_schema.json
```

**Config reference.** Precedence is datastore entry > project entry > `defaults`.

| Key | Level | Required | Default | Description |
|---|---|---|---|---|
| `project_id` | project | ✅ | | GCP project id |
| `datastore_id` | datastore | ✅ | | Datastore id |
| `schema_file` | datastore | ✅ | | Path to the schema JSON, relative to the config file |
| `schema_key` | datastore | | | Key (or list of keys) inside a wrapper file |
| `enabled` | datastore | | `true` | Set `false` to skip without deleting the entry |
| `location` | any | | `global` | `global`, `us`, `eu` |
| `collection` | any | | `default_collection` | Datastore collection |
| `schema_id` | any | | `default_schema` | Schema resource id |
| `on_breaking` | any | | `raise` | `raise` = block type changes; `skip` = apply only safe changes |
| `recreate_if_empty` | any | | `false` | For type changes: delete + recreate the schema **only if the datastore has 0 documents** |
| `verify` | any | | `true` | Re-read after writing and warn about values the service didn't keep |
| `operation_timeout` | any | | `3600` | Seconds to wait for each schema operation |
| `max_attempts` / `retry_backoff` | any | | `3` / `2.0` | Retries when another update is in progress |
| `transport` | any | | `grpc` | `grpc` or `rest` |

### 6. Validate offline (no API calls)

```bash
python3 main.py --config config.yaml --validate-only
```

This checks the config and every schema file, including typos, missing files and invalid annotations.

### 7. Dry run: see what would change

```bash
python3 main.py --config config.yaml --dry-run
```

```text
Schema evolution report (dry run)
============================================================
[OK     ] my-dev-project/us/journals-datastore  action=DRY_RUN  (0.8s)
            + publication_date
            ~ title.searchable: (unset) -> True (ATTRIBUTE_CHANGED)
[OK     ] my-dev-project/us/abstracts-datastore  action=NO_CHANGE  (0.5s)
============================================================
Total 2 | OK 2 | BLOCKED 0 | ERROR 0 | NOT_RUN 0
```

### 8. Apply

```bash
python3 main.py --config config.yaml
```

Useful options:

```bash
python3 main.py -c config.yaml --project my-dev-project                 # one project only
python3 main.py -c config.yaml --datastore journals-datastore           # one datastore only
python3 main.py -c config.yaml --fail-fast                              # stop at first failure
python3 main.py -c config.yaml --json --report-file report.json         # machine-readable report
```

| Exit code | Meaning |
|---|---|
| `0` | Every datastore OK (created, updated, no change, or dry run) |
| `1` | At least one error (config, schema file, permission, missing datastore, apply failure) |
| `2` | Breaking change blocked (or found during `--dry-run`) |

## 🔄 How a schema change is decided

| Change in schema.json | Result |
|---|---|
| Schema does not exist yet | **Created** |
| New field (must have a `type`) | ✅ Applied |
| Annotation changed (`retrievable`, `indexable`, ...) | ✅ Applied |
| `keyPropertyMapping` added / moved | ✅ Applied (set `null` on the old field to move it). Key-property fields can't be `searchable`/`indexable` (service rule, checked before any write) |
| Annotation turned off | ✅ Applied. Write `false` explicitly; omitting a key keeps the live value |
| Field present live but missing from schema.json | ⏭️ Kept. Fields are never removed (the service doesn't allow it) |
| Field **type / format** changed | 🛑 Blocked (`raise`), skipped (`skip`), or recreated if the datastore is empty (`recreate_if_empty`) |
| Nothing changed | ⏸️ No write |

> ⚠️ **Every schema update re-indexes the whole datastore.** On large datastores this can take
> hours and may add cost. Run `--dry-run` first and plan updates outside peak hours.

## 🐍 Use as a library (optional)

```bash
pip install .            # from this folder
```

```python
from schema_evolution import evolve_schema

result = evolve_schema(
    "schemas/example_schema.json",
    project_id="my-project", location="us", datastore_id="journals-datastore",
)
print(result.summary())  # CREATED | UPDATED | RECREATED | NO_CHANGE
```

All errors subclass `SchemaEvolutionError`: `ConfigError`, `InvalidSchemaError`,
`BreakingSchemaChangeError`, `DatastoreNotFoundError`, `SchemaFetchError`, `SchemaApplyError`.

## 🧪 Running the tests

```bash
pip install pytest
python3 -m pytest -q
```

The tests use in-memory fakes, so no GCP access is needed.

## ❓ Troubleshooting

| Symptom | Fix |
|---|---|
| `CONFIG ERROR ... unknown key(s)` | Typo in config.yaml. The message lists the allowed keys |
| `references an unset environment variable` | `export` the variable used in config.yaml |
| `SchemaFetchError ... PermissionDenied` | Grant the IAM permissions above; check `gcloud auth application-default login` |
| `DatastoreNotFoundError` | Check `project_id`, `location` and `datastore_id` (the location must match the datastore) |
| `BLOCKED ... TYPE_CHANGED` | Type changes aren't supported in place. Use `on_breaking: skip`, `recreate_if_empty: true` (empty datastore only) or a new datastore |
| `WARNING Not persisted by the service` | The service ignored a value. Fix it in schema.json so it isn't re-applied |
| `Timed out ... re-run later` | Large re-index. The operation may still finish; re-running is safe |

## 🤝 Contributing

Pull requests are welcome. Please add tests for new behaviour.
