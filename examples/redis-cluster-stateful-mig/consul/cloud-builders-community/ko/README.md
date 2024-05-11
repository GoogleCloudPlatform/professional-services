ko Tool Builder
===============

This cloud build build step runs [`ko`][ko] in Cloud
Build.

This Cloud Builder inherits from [gcr.io/cloud-builders/kubectl][kubectl] and
therefore requires a similar [setup][setup].

## Building this builder

To build this builder, run the following command in this directory.

```
$ gcloud builds submit . --config=cloudbuild.yaml
```

To build a specific version of `ko`, add a substitution setting `_KO_GIT_TAG` to be
the branch or tag you want to build:

```
$ gcloud builds submit . --config=cloudbuild.yaml --substitutions=_KO_GIT_TAG="v0.8.1"
```

[ko]: https://github.com/google/ko
[kubectl]: https://github.com/GoogleCloudPlatform/cloud-builders/tree/master/kubectl
[setup]: https://github.com/GoogleCloudPlatform/cloud-builders/tree/master/kubectl#using-this-builder-with-google-kubernetes-engine
