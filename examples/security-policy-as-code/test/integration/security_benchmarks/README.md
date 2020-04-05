# Combination Profile

This is a combination of PCI and GCP CIS Benchmark profiles through inheritence

## Usage

1. Clone all three repos into the same base directory

    ```
    $ ls
    inspec-combination-profile
    inspec-gcp-cis-benchmark
    inspec-gcp-pci-3.2.1
    ```

1. `cd inspec-combination-profile`
1. `make dockerbuild` to build the docker image to run inspec including all its dependencies
1. `make test` to run a standard test run of both the PCI and CIS profiles
1. `make shell` to not run inspec but to drop into a shell for manual inspec runs
