# Project factory

The Project Factory (PF) builds on top of your foundations to create and set up projects (and related resources) to be used for your workloads.
It is organized in folders representing environments (e.g. "dev", "prod"), each implemented by a stand-alone terraform [resource factory](https://medium.com/google-cloud/resource-factories-a-descriptive-approach-to-terraform-581b3ebb59c).

This directory contains a single project factory ([`dev/`](./dev/)) as an example - to implement multiple environments (e.g. "prod" and "dev") you'll need to copy the `dev` folder into one folder per environment, then customize each one following the instructions found in [`dev/README.md`](./dev/README.md).
