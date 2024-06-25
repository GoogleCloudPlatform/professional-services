# Go binaries (ie. State Tool) do not run on a plain alpine image, so we use one with a proper glibc version
FROM frolvlad/alpine-glibc

# Install State Tool
RUN wget https://platform.activestate.com/dl/cli/install.sh
RUN chmod +x ./install.sh
RUN ./install.sh -n -t /usr/local/bin

# Set up default installation dir for language runtime executables
# If you use a custom path you will have to do one of the following:
#  - Override the path here and build a new image
#  - Set the PATH at runtime
#  - Use the absolute path, eg. /mytargetpath/bin/python3
ENV PATH="/workspace/.state/bin:${PATH}"

# Source the API key from build args (optional, only required for private projects)
ARG ACTIVESTATE_API_KEY
ENV ACTIVESTATE_API_KEY=$ACTIVESTATE_API_KEY

# Uncomment the following line to deploy your language runtime at build time
# Replace owner/projectName with your project namespace as detailed in http://docs.activestate.com/platform/state/#usage
# To use a private project build your image with `--build-arg ACTIVESTATE_API_KEY=<api_key>`. Where <api_key> equals
# the output of `state export new-api-key gcloud-image`
#RUN state deploy owner/projectName

# Unset API key as we only need it for running the deployment above and we don't want to bake sensitive data into our image
ENV ACTIVESTATE_API_KEY=
