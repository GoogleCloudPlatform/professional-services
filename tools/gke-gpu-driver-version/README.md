# GKE GPU Driver Version

This tool helps you find the supported GPU driver version for a given GKE cluster version and GPU type. It automates the steps described in the [official documentation](https://cloud.google.com/kubernetes-engine/docs/how-to/gpus#map-gke-cos-gpu) for mapping GKE versions to corresponding COS and NVIDIA driver versions.

## Prerequisites:

1. [Install Rust](https://www.rust-lang.org/learn/get-started)
2. [Clone COS tools into this directory](https://cos.googlesource.com/cos/tools)
3. [Install protobuf compiler](https://protobuf.dev/installation)

## Usage

### List supported GPU types

```bash
cargo run -- list-gpu-types --gke-version <CLUSTER_VERSION>
```

### Get driver versions

```bash
cargo run -- get --gke-version <CLUSTER_VERSION> --gpu-type <GPU_TYPE>
```

## Example

### List available GPU types

```bash
cargo run -- list-gpu-types --gke-version 1.33.5-gke.1080000
```

### Get driver versions

```bash
cargo run -- get --gke-version 1.33.5-gke.1080000 --gpu-type NVIDIA_H100_80GB

or

cargo run -- get --gke-version v1.33.5-gke.1080000 --gpu-type NVIDIA_H100_80GB
```