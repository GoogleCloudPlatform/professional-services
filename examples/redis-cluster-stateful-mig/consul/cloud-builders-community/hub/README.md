# hub

This builder runs the [`hub`](https://hub.github.com/) tool, which wraps common
`git` commands to make interacting with [GitHub](https://github.com) repos even
easier.

In order to use this tool to do anything interesting, you need to configure
GitHub authorization. This is most easily accomplished by encrypting a GitHub
personal access token and making it available using the `GITHUB_TOKEN`
[environment
variable](https://cloud.google.com/cloud-build/docs/securing-builds/use-encrypted-secrets-credentials#encrypting_an_environment_variable_using_the_cryptokey).
