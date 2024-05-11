# wrangler

Cloud Builders Community Image for wrangler (Cloudflare Workers CLI )

[wrangler](https://www.npmjs.com/package/wrangler) is a command line tool for building Cloudflare Workers.

Arguments passed to this builder will be passed to `wrangler` directly


## Examples

See examples/cloudbuild.yaml

```
$ cd examples
$ gclouds build submit .
starting build "0adafa03-7bba-45d7-b985-e0e5fb30c109"
...
wrangler

Commands:
  wrangler docs [command..]            📚 Open wrangler's docs in your browser

```
## Passing Arguments to `wrangler`

arg 0 - arg N will be passed directly to wrangler CLI . e.g. ...
```
- name: gcr.io/$PROJECT_ID/wrangler
  args: ['pages', '--project-name', 'CLOUDFLARE_PROJECT_NAME', 'deploy', 'output']
```

## Managing CLOUDFLARE_API_TOKEN Secrets
Confirm the secret is in Google Secrets Manager

```
$ gcloud secrets list | head
NAME                  CREATED              REPLICATION_POLICY  LOCATIONS
CLOUDFLARE_API_TOKEN  2023-10-17T00:18:34  automatic           -
```

Update your projects / app's `cloudbuild.yaml` to reference the secrets when calling `wrangler`
```
- name: gcr.io/$PROJECT_ID/wrangler
  args: ['pages', '--project-name', 'CLOUDFLARE_PROJECT_NAME', 'deploy', 'output']
  secretEnv: ['CLOUDFLARE_API_TOKEN']
availableSecrets:
  secretManager:
  - versionName: projects/$PROJECT_ID/secrets/CLOUDFLARE_API_TOKEN/versions/1
    env: 'CLOUDFLARE_API_TOKEN'
```



