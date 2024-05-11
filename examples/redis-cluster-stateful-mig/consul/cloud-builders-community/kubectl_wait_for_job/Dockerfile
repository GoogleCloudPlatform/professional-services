FROM gcr.io/cloud-builders/gcloud

COPY kubectl_wait_for_job.bash /builder/kubectl_wait_for_job.bash

ENTRYPOINT ["/builder/kubectl_wait_for_job.bash"]
