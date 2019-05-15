# selected examples based on https://www.terraform.io/docs/modules/sources.html
module "from_github_over_https_outdated_ref" {
  source = "github.com/hashicorp/terraform?ref=v0.10.0"
}
module "from_github_over_https_latest_ref" {
  source = "github.com/hashicorp/terraform?ref=v0.12.0-rc1"
}
module "from_github_over_https_no_ref" {
  source = "github.com/hashicorp/terraform"
}
module "from_github_over_ssh_no_ref" {
  source = "git@github.com:hashicorp/terraform.git"
}
module "from_github_over_ssh_latest_ref" {
  source = "git@github.com:hashicorp/terraform.git?ref=v0.12.0-rc1"
}
module "from_github_over_ssh_outdated_ref" {
  source = "git@github.com:hashicorp/terraform.git?ref=v0.10.0"
}

# bitbucket
module "bitbucket_https_no_tag" {
  source = "bitbucket.org/atlassian/atlaskit-mk-2.git"
}
module "bitbucket_https_outdated_prefixed_tag" {
  source = "bitbucket.org/atlassian/atlaskit-mk-2.git?ref=@atlaskit/util-service-support@3.0.5"
}
module "bitbucket_https_latest_prefixed_tag" {
  source = "bitbucket.org/atlassian/atlaskit-mk-2.git?ref=@atlaskit/util-service-support@4.0.3"
}

module "bitbucket_https_outdated_tag" {
  source = "bitbucket.org/atlassian/atlaskit-mk-2.git?ref=@atlaskit/adf-schema@1.3.0"
}

## git https
module "from_github_over_https_no_ref" {
  source = "git::https://github.com/hashicorp/terraform.git"
}
module "from_github_over_https_old_ref" {
  source = "git::https://github.com/hashicorp/terraform.git?ref=v0.11.10"
}
module "from_github_over_https_latest_ref" {
  source = "git::https://github.com/hashicorp/terraform.git?ref=v0.12.0-rc1"
}

# git ssh
module "git_ssh_latest" {
  source = "git::ssh://git@github.com/GoogleCloudPlatform/terraform-google-lb-http.git?ref=1.0.10"
}
module "git_ssh_outdated" {
  source = "git::ssh://git@github.com/GoogleCloudPlatform/terraform-google-lb-http.git?ref=1.0.1"
}
module "module_subdir_outdated_example" {
  source = "git::ssh://git@github.com/hashicorp/terraform.git//modules/cloud?ref=v0.12.0-alpha4"
}
module "module_subdir_latest_example" {
  source = "git::ssh://git@github.com/hashicorp/terraform.git//modules/cloud?ref=v0.12.0-rc1"
}

# Comments should be ignored:
# module "dont_check_commented_modules" {
#   source = "git::ssh://git@github.com/DoesNotExist/example.git"
# }
