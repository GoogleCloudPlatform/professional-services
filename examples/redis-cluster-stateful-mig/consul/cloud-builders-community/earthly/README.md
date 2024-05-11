# earthly

This build step runs [earthly](https://earthly.dev/).

## Build the builder

To build the builder, run the following command:

```bash
$ gcloud builds submit . --config=cloudbuild.yaml
```

## Usage

To run the `earthly` command with the arguments `--ci` and `--push` for the target `+test`:

```
steps:
- name: 'gcr.io/$PROJECT_ID/earthly'
  args: ["--ci", "--push", "+test"]
```

