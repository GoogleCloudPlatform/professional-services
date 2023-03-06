# Contributing

Thanks for your interest in contributing to the Google Cloud Professional Services
repo!

To get started contributing:

1. Sign a Contributor License Agreement (see details below).
1. Fork the repo, develop and test your code changes.

   To test your changes before making a pull request, create a Cloud Build
   trigger for your fork on your own project.

   ```
   gcloud config set project YOUR-PROJECT
   export GITHUB_USER=YOUR_GITHUB_USERNAME

   pushd cloudbuild
   terraform init
   terraform apply -var="project_id=$(gcloud config get-value project)" -var="github_owner=${GITHUB_USER}"
   popd
   ```

   Builds require a `make` container image in the same project. Build with
   the following commands:

   ```
   pushd cloudbuild
   gcloud builds submit --tag gcr.io/$(gcloud config get-value project)/make .
   popd
   ```

1. Run the formatter locally.

   From the root of the repository, run the Docker command:
   ```
   docker run \
     --mount type=bind,source="$( pwd )",target=/workspace \
     --workdir=/workspace \
     gcr.io/$(gcloud config get-value project)/make fmt
   ```
   If you face any issues while pulling the image, please run the following command:
   ```
   gcloud auth configure-docker
   ```

1. Run the linter locally.

   From the root of the repository, run the Docker command:
   ```
   docker run \
     --mount type=bind,source="$( pwd )",target=/workspace \
     --workdir=/workspace \
     gcr.io/$(gcloud config get-value project)/make test
   ```

1. Develop using the following guidelines to help expedite your review:
    1. Ensure that your code adheres to the existing [style](https://google.github.io/styleguide).
    1. Ensure that your code has an appropriate set of unit tests which all pass.
    1. Ensure that your code has an accompanying README.md file with instructions on usage. See [awesome-readme](https://github.com/matiassingers/awesome-readme) for good examples of high-quality READMEs.
    1. Ensure that you've added a link to your contribution in the top-level [README](https://github.com/GoogleCloudPlatform/professional-services/blob/master/README.md) (alpha-order).
    1. Ensure that your submission does not include a LICENSE file. There's no need to include an additional license since all repository submissions are covered by the top-level Apache 2.0 [license](https://github.com/GoogleCloudPlatform/professional-services/blob/master/LICENSE).
    1. Ensure all source files have license headers with an up-to-date copyright date attributed to `Google LLC`.
1. Submit a pull request.

## Contributor License Agreement

Contributions to this project must be accompanied by a Contributor License
Agreement. You (or your employer) retain the copyright to your contribution;
this simply gives us permission to use and redistribute your contributions as
part of the project. Head over to <https://cla.developers.google.com/> to see
your current agreements on file or to sign a new one.

The CLA **must be signed using the same account** in the `.gitconfig` file that is
used to commit to the repository. Each commit is checked individually so a single
commit with a different configuration (e.g. `user.email`) can cause a CLA check
failure. If this scenario occurs, [squash](https://stackoverflow.com/questions/5189560/squash-my-last-x-commits-together-using-git)
your commits to get rid of the failed check.

You generally only need to submit a CLA once, so if you've already submitted one
(even if it was for a different project), you probably don't need to do it
again.

## Code reviews

All submissions, including submissions by project members, require review. We
use GitHub pull requests for this purpose. Consult
[GitHub Help](https://help.github.com/articles/about-pull-requests/) for more
information on using pull requests.
