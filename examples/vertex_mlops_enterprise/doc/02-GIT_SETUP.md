# MLOps with Vertex AI - Git integration with Cloud Build

## Accessing GitHub from Cloud Build via SSH keys

Follow this procedure to create a private SSH key to be used for Github access from Cloud Build:
https://cloud.google.com/build/docs/access-github-from-build

```
mkdir workingdir
cd workingdir
ssh-keygen -t rsa -b 4096 -N '' -f id_github -C <GITHUB_EMAIL>
```

This command creates a new SSH key `id_github`.

Add the public SSH key `id_github.pub` to your private repository's deploy keys.

Store the private SSH key in Secret Manager, in the `github-key` secret.

`gcloud secrets versions add github-key --data-file=./id_github --project=$PROJECT_ID`

After storing the secret, you can remove the local key file:

```
cd ..
rm -rf workingdir
```