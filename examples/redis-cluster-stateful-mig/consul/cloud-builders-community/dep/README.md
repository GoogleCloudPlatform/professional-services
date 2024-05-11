# [go dep](https://github.com/golang/dep)

The Dockerfile and scripts here help you use Google Cloud Builder to launch the **go dep** tool.

## Building this builder

To build this builder, run the following command in this directory.

    $ gcloud builds submit . --config=cloudbuild.yaml

## Example

```yaml
steps:
# Make sure all dependencies are in the desired state
- name: 'gcr.io/$PROJECT_ID/dep'
  args: ['ensure', '-v']
  env: ['PROJECT_ROOT=github.com/myorg/myproject']
  id: 'dep'
```
