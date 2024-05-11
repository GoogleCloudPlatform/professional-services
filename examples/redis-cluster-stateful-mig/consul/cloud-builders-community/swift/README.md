# Swift

This build step invokes `swift` commands in [Google Cloud Container Builder](https://cloud.google.com/container-builder/).

Arguments passed to this builder will be passed to `swift` directly,
allowing callers to run [any swift command](https://swift.org/lldb/).

## Swift Versions
This build step supports multiple swift versions depending on your needs.

### Available swift versions
- `gcr.io/cloud-builders/swift:latest` : The latest release branch
- `gcr.io/cloud-builders/swift` : Same as latest
- `gcr.io/cloud-builders/swift:latest-dev` : The latest development snapshot for the upcoming next major release.
- `gcr.io/cloud-builders/swift:4.2` :  The 4.2.2 release branch 
