{
    "type": "external_account",
    "audience": "//iam.googleapis.com/projects/${project_number}/locations/global/workloadIdentityPools/${pool_id}/providers/${provider_id}",
    "subject_token_type": "urn:ietf:params:oauth:token-type:jwt",
    "token_url": "https://sts.googleapis.com/v1/token",
    "credential_source": {
      "url": "http://169.254.169.254/metadata/identity/oauth2/token?api-version=2018-02-01&resource=${app_id_uri}",
      "headers": {
        "Metadata": "True"
      },
      "format": {
        "type": "json",
        "subject_token_field_name": "access_token"
      }
    },
    "service_account_impersonation_url": "https://iamcredentials.googleapis.com/v1/projects/-/serviceAccounts/${service_account_email}:generateAccessToken"
}