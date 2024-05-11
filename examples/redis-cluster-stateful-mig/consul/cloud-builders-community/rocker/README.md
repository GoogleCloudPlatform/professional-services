This build step invokes the [Rocker builder](https://github.com/grammarly/rocker), an enhancement to `docker build` that adds some additional features.

The Rocker [README](https://github.com/grammarly/rocker/blob/master/README.md) has instructions and examples or see the examples subdirectory here.

This build step can be built and pushed to your GCP repository by running

    gcloud builds submit --config=cloudbuild.yaml .
    
in this directory.

# Notice: `rocker` is unsupported

As of early 2018, Grammarly has discontinued open source support for rocker. As of June 2018, this rocker-builder repository
still builds and functions, but there will be no future development or support of this repo.
