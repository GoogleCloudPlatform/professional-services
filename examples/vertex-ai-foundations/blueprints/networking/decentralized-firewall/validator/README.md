# Decentralized firewall validator

The decentralized firewall validator is a Python scripts that utilizes [Yamale](https://github.com/23andMe/Yamale) schema
validation library to validate the configured firewall rules. 

## Configuring schemas

There are three configuration files:
- [firewallSchema.yaml](firewallSchema.yaml), where the basic validation schema is configured
- [firewallSchemaAutoApprove.yaml](firewallSchemaAutoApprove.yaml), where the a different schema for auto-approval
  can be configured (in case more validation is required than what is available in the schema settings)
- [firewallSchemaSettings.yaml](firewallSchemaSettings.yaml), configures list of allowed and approved 
  source and destination ranges, ports, network tags and service accounts.

## Building the container

You can build the container like this:

```sh
docker build -t eu.gcr.io/YOUR-PROJECT/firewall-validator:latest .
docker push eu.gcr.io/YOUR-PROJECT/firewall-validator:latest 
```

## Running the validator

Example:

```sh
docker run -v $(pwd)/firewall:/rules/ -t eu.gcr.io/YOUR-PROJECT/firewall-validator:latest
```

Output is JSON with keys `ok` and `errors` (if any were found).

## Using as a GitHub action

An `action.yml` is provided for this validator to be used as a GitHub action.

Example of being used in a pipeline:

```yaml
    - uses: actions/checkout@v2

    - name: Get changed files
      if: ${{ github.event_name == 'pull_request' }}
      id: changed-files
      uses: tj-actions/changed-files@v1.1.2

    - uses: ./.github/actions/validate-firewall
      if: ${{ github.event_name == 'pull_request' }}
      id: validation
      with:
        files: ${{ steps.changed-files.outputs.all_modified_files }}

    - uses: actions/github-script@v3
      if: ${{ github.event_name == 'pull_request' && steps.validation.outputs.ok != 'true' }}
      with:
        github-token: ${{ secrets.GITHUB_TOKEN }}
        script: |          
          var comments = [];
          var errors = JSON.parse(process.env.ERRORS);
          for (const filename in errors) {
            var fn = filename.replace('/github/workspace/', '');
            comments.push({
              path: fn,
              body: "```\n" + errors[filename].join("\n") + "\n```\n",
              position: 1,
            });
          }
          github.pulls.createReview({
            owner: context.repo.owner,
            repo: context.repo.repo,
            pull_number: context.issue.number,
            event: "REQUEST_CHANGES",
            body: "Firewall rule validation failed.",
            comments: comments,
          });
          core.setFailed("Firewall validation failed");
      env:
        ERRORS: '${{ steps.validation.outputs.errors }}'
```
