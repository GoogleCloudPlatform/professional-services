# zip

This is a tool build to simply invoke the
[`zip`](https://linux.die.net/man/1/zip) command.

Arguments passed to this builder will be passed to `zip` directly.

## Examples

The following examples demonstrate build requests that use this builder.

### Archive and compress caches

This `cloudbuild.yaml` archives and compresses the build cache directories.

```
steps:
- name: gcr.io/$PROJECT_ID/zip
  args: ['-r', 'cache.zip', '/root/.gradle']
```
