## Gpudirect-webhook

This mutating webhook automates the TCPX/TCPXO configuration for workloads 
as outlined [here](https://cloud.google.com/kubernetes-engine/docs/how-to/gpu-bandwidth-gpudirect-tcpx). 
The goal is to simplify the `TCPX/TCPXO` configuration for workloads.

### Supported machine-types

1. `a3-mega`
2. `a3-high`

### Configuration

1. Add label `gpudirect` to enable the webhook, `tcpx/tcpxo` are the accepted values to configure `TCPX/TCPXO` respectively.
2. You can use the CLI args `--create-networks` and `--create-node-pool` to let the webhook configure the networks, but currently network customization is not supported. Use `--machine-type` to set the machine type for the node pool. This requires the compute engine IAM permissions.
3. You can use existing `networks` as well, to do this add the annotation `gpudirect-networks: ^(?P<prefix>.+)(\[(?P<start>\d+)-(?P<end>\d+)\])$`. For example `gpudirect-networks: vpc-[1-8]`, this assumes that you have `8` network objects created, `vpc-1`,..`vpc-8` etc for `TCPXO`.

### Build and deploy

1. Use the [`Dockerfile`](Dockerfile) to build the image.
2. Update variables `<REPO>` and `<TAG>` and deploy using [`k8s.yaml`](k8s.yaml).
3. The manifest is configured to deploy the webhook in `default` namespace, but change it as needed.
4. Update the `namespaceSelector` to limit the namespaces for the mutating webhook.
4. [Cert-manager](https://cert-manager.io/docs/) is required to manage certificates for the webhook.
4. Debug logs can be enabled by setting the environment variable `RUST_LOG=debug`.

## Tools:

1. [Rust](https://www.rust-lang.org/learn/get-started)
2. kubectl

## Contributing

See [`CONTRIBUTING.md`](../../CONTRIBUTING.md) for details.

## License

Apache 2.0. See [`LICENSE`](../../LICENSE) for details.

## Disclaimer

This project is not an official Google project. It is not supported by
Google and Google specifically disclaims all warranties as to its quality,
merchantability, or fitness for a particular purpose.
