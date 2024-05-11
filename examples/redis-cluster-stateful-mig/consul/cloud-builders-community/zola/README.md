# Zola

[Zola](https://getzola.org/) is a popular open-source static site generator written in Rust.

This build step invokes `zola` commands in [Google Cloud Build](cloud.google.com/cloud-build/).

Arguments passed to this builder will be passed to `zola` directly, allowing callers to run [any Zola command](https://getzola.org/documentation/getting-started/cli-usage).

## Usage:

To generate a static web-site from its sources:

```
steps:
- name: gcr.io/$PROJECT_ID/zola
```

# Credits

Build steps here are mostly modified from [Hugo Google Cloud Community Build](https://github.com/GoogleCloudPlatform/cloud-builders-community/tree/master/hugo).
