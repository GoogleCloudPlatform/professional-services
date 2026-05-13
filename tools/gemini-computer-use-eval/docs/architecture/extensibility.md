# Extensibility Architecture

## Overview
The evaluation pipeline is designed to be extensible, allowing users to define custom actions, judges, and configurations without forking the repository.

## 1. Custom Actions
Users can define custom actions by inheriting from `BaseAction` and registering them.

### Registration Mechanism
We will support dynamic registration via the benchmark configuration YAML.

```yaml
agent:
  custom_actions:
    - "my_project.actions.MyCustomAction"
```

The runner will import `my_project.actions` and register `MyCustomAction`. The action class must define its name.

## 2. Custom Judges
Users can define custom logic for verifying task success.

```yaml
criteria:
  custom_judges:
    - "my_project.judges.MyCustomJudge"
```

## 3. Configuration Overrides
The `config.yaml` is the single source of truth. We will refactor `Settings` (pydantic) to allow deep merging of YAML configs with environment variables and default presets.

## 4. Plugin System Implementation
We will introduce a `PluginManager` class responsible for:
1.  Loading external modules.
2.  Validating plugin interfaces (Action, Judge).
3.  Registering them into the `ActionExecutor` and `JudgeRegistry`.
