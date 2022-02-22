# Terraform Module Version Checking

_check-terraform-module-versions_ is a tool that searches a repository for references to git-based (GitHub, Bitbucket, and generic git) remote terraform modules and, if tagged, compares each with the latest tag of the remote repository. It outputs a message if they do not match and additionally notifies if no tag is used.

To facilitate its use in build pipelines, where a warning message may be preferable to an error (for example, a minor version update has been pushed to a remote module whose use has not been tested), the script supports two non-zero exit codes. It will output an appropriate message and return an exit code of:
* `1` as a warning, when no remote modules were found OR remote modules were found and one or more does not reference a tag (while all other remotes are up to date)
* `2` when one or more remote modules found that are behind the latest tag

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

## Testing
A `tests` directory is included. Tests are run via `test.sh` which runs the check command against `tests.tf` which contains a (non-exhaustive) collection of the various methods of referring to remote module sources.

## Helpful links

  -  Terraform module sources: https://www.terraform.io/docs/modules/sources.html
