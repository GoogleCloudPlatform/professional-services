# Do not delete this folder

This folder is a requirement for `gcloud beta terraform vet`. Upon initialization, the tools looks for shared rego functions in this directory. As of right now, the policy library does not rely on shared functions, although it might at some point in the future. If this is not present even though we don't utilize shared functions, initialization will fail.
