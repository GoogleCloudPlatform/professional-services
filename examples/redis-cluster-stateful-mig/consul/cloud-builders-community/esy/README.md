# Esy

This build step invokes `esy` commands in [Google Cloud Build](https://cloud.google.com/cloud-build).

Arguments passed to this builder will be passed to `esy` directly, allowing
callers to run [any esy command](https://esy.sh/docs/en/commands.html).

## Building this Builder

Before using this builder in a Cloud Build config, it must be built and pushed to the registry in your 
project. Run the following command in this directory:

```bash
gcloud builds submit .
```

> **Advanced builder building:** To specify a particular version of esy, provide the esy version
> number, and the checksum of that version's zip archive, as Cloud Build [substitutions](https://cloud.google.com/cloud-build/docs/configuring-builds/substitute-variable-values#using_user-defined_substitutions):
>
> ```bash
> gcloud builds submit --substitutions=_ESY_VERSION=0.5.8 .
> ```

## Status

This is unsupported demo-ware. Use at your own risk!
