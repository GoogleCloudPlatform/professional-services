FROM google/cloud-sdk:latest

# Execute next commands in the directory /workspace
WORKDIR /workspace

# Copy over the script to the /workspace directory
COPY gcs-to-gcs.sh .

# Just in case the script doesn't have the executable bit set
RUN chmod +x ./gcs-to-gcs.sh

# Run the script when starting the container
CMD [ "./gcs-to-gcs.sh" ]   