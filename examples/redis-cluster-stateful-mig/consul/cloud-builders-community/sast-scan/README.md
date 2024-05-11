# sast-scan

[sast-scan](https://github.com/AppThreat/sast-scan) is a fully open-source SAST scanner supporting a range of languages and frameworks. It integrates with major CI pipelines and IDE such as VS Code and Visual Studio.

## Usage:

Minimal configuration example to perform sast scan for a python project

```yaml
steps:
  - name: "gcr.io/$PROJECT_ID/sast-scan"
    args: ["--type", "python"]
```

Refer to the project's [README](https://github.com/AppThreat/sast-scan) for all available languages that can be specified for `type` argument.
