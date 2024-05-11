# Tool builder: `gcr.io/$PROJECT_ID/yarn-puppeteer`

This Container Builder build step runs the `yarn` tool but with the necessary dependencies for [puppeteer](https://github.com/GoogleChrome/puppeteer).

It uses the small alpine-node base.

## Usage

### With Jest

This builder expects a `jest-puppeteer.config.ci.js` in the project root. Take a look at the example [jest-puppeteer.config.ci.js](examples/hello_world/jest-puppeteer.config.ci.js) that configures puppeteer to launch a headless chromium browser.

## Building and publishing this builder

To build and publish this builder, run the following command in this directory.

    $ gcloud builds submit . --config=cloudbuild.yaml
