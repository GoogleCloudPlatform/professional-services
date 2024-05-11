# Container for F# as a build step on gcloud

See [docs](https://cloud.google.com/cloud-build/docs/concepts/custom-build-steps)

## Usage:

```
steps:
- name: gcr.io/$PROJECT_ID/fsharp
  id: fsharp-version
  args: ['fsharpc', '--help']
- name: gcr.io/$PROJECT_ID/fsharp
  id: fsharp-build
  args: ['msbuild', '/p:Configuration=Release', 'src/App.sln']
```

## Read mode

This build tool is based on the [official F# docker container][fo]. You can
browse its README for details on what's included.

 [fo]: https://github.com/fsprojects/docker-fsharp
