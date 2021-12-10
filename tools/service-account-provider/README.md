# Service Account Provider (SAPRO)

SAPRO allows to request tokens for Service Accounts from a limited permissions environment. [Gitlab CI JWT tokens](https://docs.gitlab.com/ee/ci/examples/authenticating-with-hashicorp-vault/index.html#how-it-works) contain various claims for the build and are signed with the JWKS of the Gitlab instance. It's basically a blueprint to workaround non-OIDC compliant identity providers that you want to federate. 

SAPRO limits the creation of tokens to protected branches (claim ref_protected=true)

![](sapro.png)

The configuration for SAPRO is provided via a file stored in GCS.

```yaml
issuers:
  - name: gitlab.com
    jwks_url: "https://gitlab.com/-/jwks"

pipelines:
  - name: "group/repo"
    branches:
      - ref: main
        service_accounts: 
          - desiredsa@project.iam.gserviceaccount.com
        allowed_scopes:
          - https://www.googleapis.com/auth/cloud-platform

```

jwks_url can either be configured with the JWKS URL of the Gitlab instance (SAPRO will then try to fetch the JWKS from Gitlab, this obviously needs a network accessibility). Otherwise you can package the jwks as a json file into the container (every path not beginning with http will be interpreted as a file path).

The pipelines configuration takes name to the group/project that should be granted access. This name attribute is evaluated against the CI_JWT in a way that the *project_path* claim begins with this name.

The location of the configuration file can configured via the Environment Variable *GCS_CONFIG_LINK* (e.g. gs://bucketname/objectname) and *CONFIG_REFRESH_INTERVAL* interval in minutes after which the configuration is refetched (disabled with 0; default value 5)

The service account running SAPRO is needed to be able to read the file from GCS (e.g. _roles/storage.objectViewer_ on the file).

The SA running SAPRO also needs the roles _roles/iam.serviceAccountUser_ and _roles/iam.serviceAccountTokenCreator_
