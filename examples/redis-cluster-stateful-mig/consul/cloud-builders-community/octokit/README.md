# Github octokit/rest.js

This builder contains the [Github Octokit](https://octokit.github.io/rest.js/v18) library that automatically authenticates
via a private Github App. It is a more secure variant of the [Github Builder](https://github.com/GoogleCloudPlatform/cloud-builders-community/tree/master/github) (which uses Personal Access Token).

## Creating a Private Github App

Please refer to the [Official Documentation on Creating a Github App](https://docs.github.com/en/developers/apps/creating-a-github-app)
to create your new private Github App. Additional notes:
- You don't need to provide a webhook if you don't want to use it. The octokit builder doesn't use it.
- Make sure to give this app access to all APIs you will want to use with Octokit. [Here is the Reference](https://docs.github.com/en/rest/reference).
- Make sure to install the application for your Organization or Account and save the *Installation ID*.

## Generating & Storing a Private Key

1) Refer to the [Official Documentation on Creating a Private Key](https://docs.github.com/en/developers/apps/authenticating-with-github-apps)
to create your private key.
2) Refer to the [Google Cloud Docs for Secret Manager](https://cloud.google.com/secret-manager/docs/creating-and-accessing-secrets)
to store the generate private key in a Secret Manager.
3) Make sure your `[PROJECT_ID]@cloudbuild.gserviceaccount.com` Service Account has the following role: `roles/secretmanager.secretAccessor`

## Using the Builder

The builder does the following steps for you:
1) Gets the Private Key from the defined Secret.
2) Uses this Private Key to authorize Octokit with the defined installation.
3) Creates an `octokit` variable which can be used to call the API on behalf of the provided installation.

The example below shows a two-step build that:
1) Runs the `terraform` builder to output plan into a file.
2) Creates a new Comment Review on a Github Pull Request with the full plan attached as a comment.

```yaml
steps:
  - name: 'gcr.io/$PROJECT_ID/terraform'
    entrypoint: 'bash'
    args: [
        '-c',
        'terraform init && terraform plan -no-color > plan.txt'
    ]
  - name: 'gcr.io/$PROJECT_ID/octokit'
    env:
      - "APP_ID=<github-app-id>"
      - "INSTALLATION_ID=<github-app-installation-id>"
      - "INSTALLATION_PK=sm://<your-secret-id>/latest"
    args:
      - |-
        const planContent = fs.readFileSync('./plan.txt', 'utf-8', 'r+');
        await octokit.pulls.createReview({
          owner: '$_GITHUB_USER',
          repo: '$REPO_NAME',
          pull_number: '$_PR_NUMBER',
          event: 'COMMENT',
          body: `<details>
            <summary>Terraform Plan Results</summary>
          \`\`\`
          $${planContent}
          \`\`\`
          </details>`
        });
substitutions:
  _GITHUB_USER: <your-user>
```

Understanding the code:
- The script is using Node.js `eval()` and wraps the provided code in an `async` function.
All asynchronous calls in the script **must** use `await`, otherwise the step may exit without executing the steps or interrupt them.
- The docs for the `octokit.pulls.createRevire` can be found [in the official docs](https://octokit.github.io/rest.js/v18#pulls-create-review). Please refer 
to these docs whenever you need to call the API.
- The `INSTALLATION_PK` has two modes. When the value is prefixed by `sm://` (as in the example), the builder tries to fetch
the key from the Secret Manager. Otherwise it searches the file system. If you want to use your private key as a file, use
normal file path, e.g. `./my_pk.pem`.
