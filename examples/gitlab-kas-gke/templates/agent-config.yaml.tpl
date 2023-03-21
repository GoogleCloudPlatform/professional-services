# Reference: https://docs.gitlab.com/ee/user/clusters/agent/gitops.html#gitops-configuration-reference
gitops:
  manifest_projects:
    # Required. Path to a Git repository that has Kubernetes manifests in YAML or JSON format.
  - id: ${gitlab_project}
    paths:
    # Required. Read all YAML files from this directory and any subdirectories.
    - glob: '/manifests/*.{yaml,yml,json}'
