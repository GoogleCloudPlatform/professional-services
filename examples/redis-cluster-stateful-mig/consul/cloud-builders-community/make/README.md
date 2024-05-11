# Make

This build step provides a container with the build-essentials package
installed.  It is intended for running Make targets composed of shell commands,
such as targets that make modifications to a Dockerfile.

It is capable of running simple GCC builds, but the primary use is in conjuction
with other containers as part of a Google Container Builder configuration.

The entrypoint for this container is bash, so it is necessary to include the
whole make command.  For example:

steps:
- name: 'gcr.io/cloud-community-builders/make
  args: ['build']
