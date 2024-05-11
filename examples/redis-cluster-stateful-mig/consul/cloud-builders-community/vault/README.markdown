# [vault](https://www.vaultproject.io) cloud builder

## Vault cloud builder
This builder can be used to run the vault in the GCE. 

Vault is a tool for securely accessing secrets. A secret is anything that you want to tightly control access to, such as API keys, passwords, certificates, and more. Vault provides a unified interface to any secret, while providing tight access control and recording a detailed audit log. 

For more information, please see:

* [Vault documentation] https://www.vaultproject.io/docs
* [Vault on GitHub] https://github.com/hashicorp/vault


### Building this builder
To build this builder with the default version, run the following command in this directory.
```sh
$ gcloud builds submit --config=cloudbuild.yaml
```

To override the builder version for Vault, run the following command in this directory (make sure to update the version and the SHA256 hash with the desired ones).
```
$ gcloud builds submit --config=cloudbuild.yaml \
  --substitutions=_VAULT_VERSION="1.2.3",_VAULT_VERSION_SHA256SUM="fe15676404aff35cb45f7c957f90491921b9269d79a8f933c5a36e26a431bfc4"
```
### Using this builder
The primary reason for using this builder  is to renew Vault tokens encrypted by KMS every time cloudbuild runs.
For example
```
steps:
  #renew token 
  - name: 'gcr.io/${PROJECT_ID}/vault:1.2.3'
    args: [
      'token',
      'renew',
      '-increment=${VAULT_INCR}'
    ]
    env:
     - "VAULT_ADDR=${_VAULT_ADDR}"
     - "VAULT_INCR=${_VAULT_INCR}"
    secretEnv:
      - "VAULT_TOKEN"    
    timeout: 60s
secrets:
  - kmsKeyName: projects/example/locations/global/keyRings/default/cryptoKeys/default 
    secretEnv:
      VAULT_TOKEN: BASE64_ENCODED_KMS_SECRET
substitutions:
  _VAULT_ADDR: "https://vault.example.com"
  _VAULT_INCR: "43200m" #30 days
tags: ['vault_token_renew']
timeout: 60s
```

### Using this builder with Google Container Engine
To use this builder, your [builder service account](https://cloud.google.com/container-builder/docs/how-to/service-account-permissions) will need IAM permissions sufficient for the operations you want to perform. Adding the 'Kubernetes Engine Service Agent' role is sufficient for running the examples. Refer to the Google Cloud Platform [IAM integration page](https://cloud.google.com/container-engine/docs/iam-integration) for more info.

### Using this builder image anywhere else
This image can be run on any Docker host, without GCE. Why would you want to do this? It'll let you run vault locally, with no environment dependencies other than a Docker host installation. You can use the [local Cloud Build](https://cloud.google.com/cloud-build/docs/build-debug-locally) for this; but if you're curious or have
weird / advanced requirements (for example, if you want to run Vault as a build step on another platform like Travis or Circle CI, and don't want to use Cloud Build, it is an option).

You'll need to:
 1. Provide a service account key file
 2. Mount your project directory at '/workspace' when you run docker
 ```sh
docker run -it --rm -e GCLOUD_SERVICE_KEY=${GCLOUD_SERVICE_KEY} \
  --mount type=bind,source=$PWD,target=/workdir \
  -w="/workdir" \
  gcr.io/$PROJECT_ID/vault <command>
```
