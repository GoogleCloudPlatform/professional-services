# rsync

This is a tool build to invoke the `rsync` command.

Arguments passed to this builder will be passed to `rsync` directly.

## Examples

The following examples demonstrate build requests that use this builder.

### Rsync to a remote folder

This `cloudbuild.yaml` syncs local folder to remote folder by deleting existing content in the destination.

```
steps:
- name: gcr.io/$PROJECT_ID/rsync
  args:
  - -e
  - 'ssh -p 8888'
  - --recursive
  - --delete
  - --verbose
  - dist/
  - user@remote:~/app
```
