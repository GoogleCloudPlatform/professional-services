# pypi-tools

The intention of this cloud-builder is to assist with managing PyPI packages.

Included tools:
* [setuptools](https://pypi.org/project/setuptools/)
* [wheel](https://pypi.org/project/wheel/)
* [twine](https://pypi.org/project/twine/)
* [yolk3k](https://pypi.org/project/yolk3k/)

See also [documentation for packaging python projects](https://packaging.python.org/tutorials/packaging-projects/).

This build step invokes `/bin/sh` in [Google Cloud Build](https://cloud.google.com/cloud-build).

Arguments passed to this builder will be passed to `/bin/sh` directly. The reason for using shell is due to the numerous supported tools and their nature.

As you know, the interaction with pypi requires credentials. It is recommended to store the password on [KMS](https://cloud.google.com/kms/), then use it as an [encrypted resource](https://cloud.google.com/cloud-build/docs/securing-builds/use-encrypted-secrets-credentials). See [example](./examples/cloudbuild.yaml).

## Motivation

This cloud-builder can assist with the following use cases:

* Sanity build of a python package
* Pushing a package to pypi/test.pypi
* Conditional push of a package - only if a newer version was committed

## Python Version

By default, the Dockerfile is using python `3.7`. To use a different version we can pass a build-arg to the `docker build` command.

The supplied [cloudbuild](./cloudbuild.yaml) will create this builder for versions `2.7`, `3.6`, `3.7` (`latest`).

Supported versions are any version that has a `python:<version>-alpine` docker image distributed.

## Examples
Please check [`examples`](examples)
