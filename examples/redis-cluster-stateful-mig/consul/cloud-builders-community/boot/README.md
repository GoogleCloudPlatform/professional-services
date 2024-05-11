# boot

This build step invokes `boot` commands in [Google Cloud Build](cloud.google.com/cloud-build/).

Arguments passed to this builder will be passed to `boot` directly, allowing
callers to run [any boot
command](https://www.boot-clj.com).

## Credentials

You can securely pass credentials to `boot` [using encrypted
files](https://cloud.google.com/cloud-build/docs/tutorials/using-encrypted-files).

See examples in the `examples` subdirectory.

## Status

This is unsupported demo-ware. Use at your own risk!
