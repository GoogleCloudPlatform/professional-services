# Assume AWS ARN Role from a GCP Service Account

Disclaimer: THIS IS NOT A PRODUCTION READY CODE. It's meant to be used as a PoC.

It can be needed to have access to one or more AWS services from a GCP compute service without the exchange of any security keys.  
It can be a VM, a container inside a GKE cluster, a Cloud Run container, you name it.

By using this code, it will be possible to assume an AWS ARN Role, without the need to create and store any credentials on both sides.

As an example let's see a scenario where there's the need to transfer data from an AWS S3 Bucket to a GCP GCS Bucket. In this case two AWS ARN Roles can be created, one dedicated to the action of assuming another Role, and a second one that would actually have access to the S3 Bucket.

The code under the gcp-auth folder, once compiled, will take two parameters as input, an Identity ARN role and a Service ARN role. The Identity ARN is the one that should be used from the GCP service account to authenticate to the AWS IAM APIs, the Service ARN instead is the one used, once assumed the Identity ARN, to actually make API calls to S3.

To finalize the process, a default AWS credentials (like the one showned below) file should be placed in the object (VM, container, etc) that will use the binary to call AWS:

```
[default]
credential_process = /usr/local/bin/gcp-auth --env=true
```

As from the example, the input ARNs can be also provided as environment variables, this will ensure greater security during the final setup.


```
export GCP_AUTH_IDENTITY=arn:aws:iam::000000000:role/external-gcp-auth
export GCP_AUTH_SERVICE=arn:aws:iam::000000000:role/access-to-s3-from-gcp
```

There's one last step that should be taken, connect our GCP Service Account to the AWS S3 ARN. During the creation of the AWS ARN, it's possibile to specify it as Trusted Identity, select Web identity and then Google. By pasting the GCP SA Unique ID into the Audience box the final step is completed.