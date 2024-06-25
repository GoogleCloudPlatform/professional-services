# npm-cli-package

Install a npm cli package (e.g.: [lerna](https://github.com/lerna/lerna)) and
invoke it at entrypoint.

The node image used to build the builder and the npm cli package to install
can be overridden by substitutions. Please see
[cloudbuild.yaml](./cloudbuild.yaml)  or the example below for available substitutions and their
default values.

```sh
gcloud builds submit \
  --config=cloudbuild.yaml \
  --substitutions=_NODE_IMAGE=node,_NODE_TAG=12,_NPM_CLI_PACKAGE=lerna \
  --project=<GCR_PROJECT>
```
