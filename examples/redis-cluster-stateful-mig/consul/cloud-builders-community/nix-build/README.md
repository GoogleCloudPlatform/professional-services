# nix-build

This build step uses the [Nix build
system](https://nixos.org/nix/manual/#sec-nix-build), which
executes builds described in the Nix config language.

As an example, the build config executes a script that produces a
layered Docker image based on [these
instructions](https://grahamc.com/blog/nix-and-layered-docker-images).

## Building this builder

To build this builder, run the following command in this directory.

    $ gcloud builds submit . --config=cloudbuild.yaml

