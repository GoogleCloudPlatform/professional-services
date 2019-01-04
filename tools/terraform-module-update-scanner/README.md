# Terraform Module Version Checking

_check-terraform-module-versions_ is a tool that searches a repository for references to remote terraform modules and, if tagged, compares each with the latest tag of the remote repository. It outputs a message if they do not match and additionally notifies if no tag is used.

## Usage

_check-terraform-module-versions_ takes no arguments and will recursively search the current working directory from which it is run.

```
$ ../check-terraform-module-versions
...
For the referenced remote repository: git::ssh://git@github.com/GoogleCloudPlatform/terraform-google-lb-http.git
A newer tag is available: 1.0.10 (1.0.1 found)
Occurs in:
./tests.tf
...
```

## Helpful links

  -  Terraform module sources: https://www.terraform.io/docs/modules/sources.html
