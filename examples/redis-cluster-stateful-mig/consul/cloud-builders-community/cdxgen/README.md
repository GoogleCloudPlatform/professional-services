# cdxgen

[cdxgen](https://github.com/AppThreat/cdxgen) creates a valid CycloneDX Software Bill-of-Materials (SBOM) containing an aggregate of all project dependencies for node.js, python, java and golang projects. Optionally, it can submit the generated BOM to [dependency track](https://github.com/DependencyTrack/dependency-track/) or AppThreat server for analysis

## Usage:

Minimal configuration example to generate bom

```yaml
steps:
  - name: "gcr.io/$PROJECT_ID/cdxgen"
    args: ["--output", "bom.xml", "src"]
```

To generate bom and submit to the server

```yaml
steps:
  - name: "gcr.io/$PROJECT_ID/cdxgen"
    id: "Generate bom.xml and submit to dependency track/AppThreat server"
    args:
      [
        "--output",
        "bom.xml",
        "--serverUrl",
        "https://deptrack.appthreat.io",
        "--apiKey",
        "CHANGEME",
        "src",
      ]
```

Follow the [encrypted secrets](https://cloud.google.com/cloud-build/docs/securing-builds/use-encrypted-secrets-credentials) guide to securely store and retrieve the `apiKey` for the server.
