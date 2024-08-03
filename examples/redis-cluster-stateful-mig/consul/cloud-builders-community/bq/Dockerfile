FROM gcr.io/cloud-builders/gcloud

# Create an empty bigqueryrc file so that the bq command uses the configuration
# from gcloud.
RUN touch $HOME/.bigqueryrc

ENTRYPOINT ["bq"]
