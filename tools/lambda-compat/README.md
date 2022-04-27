# Lambda compatibility tools for Cloud Run

The Lambda compatibility tools for Cloud Run consist of two programs to
facilitate running of unmodified Lambda serverless functions on Google Cloud's
Cloud Run: `lambda-build` and `lambda-compat`

  * `lambda-build`: reads the [`template.yaml` format](https://docs.aws.amazon.com/serverless-application-model/latest/developerguide/sam-specification.html) of 
    [Serverless Application Model](https://docs.aws.amazon.com/serverless-application-model/latest/developerguide/what-is-sam.html) and
    outputs `Dockerfile`s for serverless functions and associated Terraform
    scripts to deploy them.
  * `lambda-compat`: emulates the [Lambda Runtime API](https://docs.aws.amazon.com/lambda/latest/dg/runtimes-api.html) and
    relays the results via standard HTTP protocol responses. It also supports automatically calling 
    [`AssumeRoleWithWebIdentity`](https://docs.aws.amazon.com/STS/latest/APIReference/API_AssumeRoleWithWebIdentity.html)
    using OIDC token retrieved from the GCP metadata endpoint and passing the resulting session token to the
    Lambda function.

## Building

Build requires at least Go 1.16. To install the tools, run:

```sh
# go install github.com/GoogleCloudPlatform/professional-services/tools/lambda-compat/cmd/lambda-compat
# go install github.com/GoogleCloudPlatform/professional-services/tools/lambda-compat/cmd/lambda-build
```

The binaries should now be in `$GOPATH/bin`.

## Usage

### Simple function

You can deploy [a sample function](https://github.com/serverless-projects/aws-sam-examples/tree/master/samples_1/hello-world/python)
from the examples repository:

```sh
# export PROJECT_ID=<YOUR-GCP-PROJECT>
# gcloud services enable artifactregistry.googleapis.com
# gcloud artifacts repositories create lambdafunctions --repository-format=docker --location=europe
# gcloud auth configure-docker europe-docker.pkg.dev
Create request issued for: [lambdafunctions]
Created repository [lambdafunctions].
# git clone https://github.com/serverless-projects/aws-sam-examples.git
# cd aws-sam-examples/samples_1/hello-world/python/
# lambda-build -registry europe-docker.pkg.dev/$PROJECT_ID/lambdafunctions -tag v1 template.yaml
10:27AM INF Lambda compatibility tool for Cloud Run
10:27AM INF Processing SAM template file file=template.yaml
10:27AM INF Creating Dockerfile file file=HelloWorldFunction/Dockerfile template=python.tpl
10:27AM INF To build container, run:
10:27AM INF   docker build -t europe-docker.pkg.dev/$PROJECT_ID/lambdafunctions/HelloWorldFunction:v1 -f HelloWorldFunction/Dockerfile .
10:27AM INF Creating Terraform file file=HelloWorldFunction/main.tf template=terraform_main.tf.tpl
10:27AM INF Creating Terraform file file=HelloWorldFunction/outputs.tf template=terraform_outputs.tf.tpl
10:27AM INF Creating Terraform file file=HelloWorldFunction/variables.tf template=terraform_variables.tf.tpl
10:27AM INF Creating Terraform file file=HelloWorldFunction/versions.tf template=terraform_versions.tf.tpl# cd HelloWorldFunction/
# docker build -t europe-docker.pkg.dev/$PROJECT_ID/lambdafunctions/helloworldfunction:v1 -f HelloWorldFunction/Dockerfile .
Sending build context to Docker daemon  160.8MB
Successfully built 8b14af12119a
Successfully tagged europe-docker.pkg.dev/$PROJECT_ID/lambdafunctions/helloworldfunction:v1
# docker push europe-docker.pkg.dev/$PROJECT_ID/lambdafunctions/helloworldfunction:v1
# cd HelloWorldFunction/
# echo "project_id=\"$PROJECT_ID\"" > terraform.tfvars
# terraform init
# terraform apply
# curl -d '{"key1":"1","key2":"2","key3":"3"}' -H "Authorization: Bearer $(gcloud auth print-identity-token)" $(terraform output -raw url)
"Hello World"
```

### Workload Identity Federation example

Deploy the sample function that retrieves the content type of a file on a S3 bucket.
Requires that you have configured credentials correct for both cloud providers.

```sh
# cd aws-sam-examples/samples_2/s3-get-object-python3/
# lambda-build -registry europe-docker.pkg.dev/$PROJECT_ID/lambdafunctions -tag v1 -var createrole=1 -var awsregion=eu-north-1 template.yaml
1:08PM INF Lambda compatibility tool for Cloud Run
1:08PM INF Processing SAM template file file=template.yaml
1:08PM INF Creating subdirectory directory=s3getobjectpython3/
1:08PM INF Creating Dockerfile file file=s3getobjectpython3/Dockerfile template=python.tpl
1:08PM INF To build container, run:
1:08PM INF   docker build -t europe-docker.pkg.dev/$PROJECT_ID/lambdafunctions/s3getobjectpython3:v1 -f s3getobjectpython3/Dockerfile .
1:08PM INF Creating Terraform file file=s3getobjectpython3/main.tf template=terraform_main.tf.tpl
1:08PM INF Creating Terraform file file=s3getobjectpython3/outputs.tf template=terraform_outputs.tf.tpl
1:08PM INF Creating Terraform file file=s3getobjectpython3/variables.tf template=terraform_variables.tf.tpl
1:08PM INF Creating Terraform file file=s3getobjectpython3/versions.tf template=terraform_versions.tf.tpl
1:08PM DBG Unknown resource type ignored type=AWS::S3::Bucket
# docker build -t europe-docker.pkg.dev/$PROJECT_ID/lambdafunctions/s3getobjectpython3:v1 -f s3getobjectpython3/Dockerfile .
# docker push europe-docker.pkg.dev/$PROJECT_ID/lambdafunctions/s3getobjectpython3:v1
# cd s3getobjectpython3/
# echo "project_id=\"$PROJECT_ID\"" > terraform.tfvars
# terraform init
# terraform apply
# curl -d '{"Records":[{"s3":{"bucket":{"name":"YOUR-S3-BUCKET"},"object":{"key":"sample.png"}}}]}' -H "Authorization: Bearer $(gcloud auth print-identity-token)" $(terraform output -raw url)
"image/png"
```

## Configuration

### lambda-compat

The `lambda-compat` tool can be configured using a few environment variables:

  * `OIDC_AUDIENCE`: specifies the audience in `AssumeRoleWithWebIdentity` call
  * `AWS_ROLE_ARN`: specifies the role ARN in `AssumeRoleWithWebIdentity` call
  * `REGION_MAP`: json-encoded string with GCP regions as keys and AWS regions in values
  * `JSON_TRANSFORM`: allow you to use Go's [`text/template`](https://pkg.go.dev/text/template)
     to transform the incoming JSON-formatted HTTP request body. Set the variable to
     point to a template file. The template will receive parameters: 
       * `Body`: original JSON body unmarshalled
       * `URL`: [URL structure](https://pkg.go.dev/net/url#URL)
       * `Method`: HTTP method used
       * `RemoteAddr`: Remote IP address
       * `Headers`: [HTTP headers](https://pkg.go.dev/net/http#Header)

### lambda-build

`lambda-build` command line flags:
```
  -dockerfile
        generate Dockerfile (default true)
  -dockerfile-path string
        path and filename for Dockerfile (default "Dockerfile")
  -project-id string
        GCP project ID
  -registry string
        Container registry to use (eg. docker.pkg.dev/project-id/registry)
  -tag string
        Container image tag (default "latest")
  -target-dir string
        directory to create Dockerfile and Terraform files in (default ".")
  -template-dir string
        location of Dockerfile and Terraform templates (default "templates/")
  -terraform
        generate Terraform files (default true)
  -terraform-path string
        path for Terraform files (default "./")
  -var value
        Additional template variable (key=value)
```

The templates used to generate `Dockerfile` and Terraform files are bundled inside
the binary and will be written out to `-template-dir` during initial run. You can
edit the templates to adapt them to your needs.
