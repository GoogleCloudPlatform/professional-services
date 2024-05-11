# Cloud Dataproc Custom Image
This builder is used to generate a [Cloud Dataproc custom image](https://cloud.google.com/dataproc/docs/guides/dataproc-images) by leveraging the [google-provided Python script](https://github.com/GoogleCloudPlatform/dataproc-custom-images).

## Usage

From this folder, run the following:

    PROJECT_ID=[YOUR_PROJECT_ID]
    gcloud builds submit . --config=cloudbuild.yaml

## Example

You can build the example by running those commands inside the examples directory:

    SUBSTITUTIONS=\
    _PROJECT_ID="<YOUR-PROJECT-ID>",\
    _CUSTOM_IMAGE_NAME="pip-stuff",\
    _DATAPROC_VERSION="1.4.16-debian9",\
    _ZONE="us-central1-a",\
    _CUSTOMIZATION_SCRIPT_PATH="customization-script.sh",\
    _GCS_LOGS="<BUCKET_NAME>/logs",\
    _DISK_SIZE=100

    gcloud builds submit . --config=cloudbuild.yaml \
    --substitutions ${SUBSTITUTIONS} \
    --timeout 3600

Parameter | Description 
-----------|-------------
_PROJECT_ID | Your project Id. *<br>ex: abc-example*
_CUSTOM_IMAGE_NAME | Name of the Cloud Dataproc custom image that this will create in your project. *<br>ex: my-custom-image*
_DATAPROC_VERSION | Cloud Dataproc's version. *<br>ex: 1.4.16-debian9*
_ZONE | The GCE zone for running your GCE instance. *<br>ex: us-central1-a*
_CUSTOMIZATION_SCRIPT_PATH | Local path where to find the script that is used to create the custom image. *<br>ex: customization-script.sh*
_GCS_LOGS | Cloud Storage location where to store logs. Does **not** include gs:// *<br>ex: abc-example-custom-image/logs*
_BASE_IMAGE_URI | The full image URI for the base Dataproc image. The customization script will be executed on top of this image instead of an out-of-the-box Dataproc image. This image must be a valid Dataproc image. This argument is mutually exclusive with --dataproc-version.
_FAMILY (optional) | The family of the source image. This will cause the latest non-deprecated image in the family to be used as the source image.
_PROJECT_ID (optional) | The project Id of the project where the custom image is created and saved. The default project Id is the current project id specified in gcloud config get-value project.
_OAUTH (optional) | The OAuth credential file used to call Google Cloud APIs. The default OAuth is the application-default credentials from gcloud.
_MACHINE_TYPE (optional) | The machine type used to build custom image. The default is n1-standard-1.
_NO_SMOKE_TEST (optional) | This parameter is used to disable smoke testing the newly built custom image. The smoke test is used to verify if the newly built custom image can create a functional Dataproc cluster. Disabling this step will speed up the custom image build process; however, it is not advised. Note (optional) | The smoke test will create a Dataproc cluster with the newly built image, runs a short job and deletes the cluster in the end.
_NETWORK (optional) | This parameter specifies the GCE network to be used to launch the GCE VM instance which builds the custom Dataproc image. The default network is 'global/networks/default'. If the default network does not exist in your project, please specify a valid network interface. For more information on network interfaces, please refer to GCE VPC documentation.
_SUBNETWORK (optional) | This parameter specifies the subnetwork that is used to launch the VM instance that builds the custom Dataprocimage. A full subnetwork URL is required. The default subnetwork is None. For more information, please refer to GCE VPC documentation.
_NO_EXTERNAL_IP (optional) | This parameter is used to disables external IP for the image build VM. The VM will not be able to access the internet, but if Private Google Access is enabled for the subnetwork, it can still access Google services (e.g., GCS) through internal IP of the VPC.
_SERVICE_ACCOUNT (optional) | The service account that is used to launch the VM instance that builds the custom Dataproc image. The scope of this service account is defaulted to "/auth/cloud-platform", which authorizes VM instance the access to all cloud platform services that is granted by IAM roles. Note (optional) | IAM role must allow the VM instance to access GCS bucket in order to access scripts and write logs.
_EXTRA_SOURCES (optional) | Additional files/directories uploaded along with customization script. This argument is evaluated to a json dictionary.
_DISK_SIZE (optional) | The size in GB of the disk attached to the VM instance used to build custom image. The default is 15 GB.
_ACCELERATOR (optional) | The accelerators (e.g. GPUs) attached to the VM instance used to build custom image. This flag supports the same values as gcloud compute instances create --accelerator flag. By default no accelerators are attached.
_BASE_IMAGE_URI (optional) | The partial image URI for the base Dataproc image. The customization script will be executed on top of this image instead of an out-of-the-box Dataproc image. This image must be a valid Dataproc image. The format of the partial image URI is the following (optional) | projects/<project_id>/global/images/<image_name>.
_STORAGE_LOCATION (optional) | The storage location (e.g. US, us-central1) of the custom GCE image. This flag supports the same values as gcloud compute images create --storage-location flag. If not specified, the default GCE image storage location is used.
_SHUTDOWN_INSTANCE_TIMER_SEC (optional) | The time to wait in seconds before shutting down the VM instance. This value may need to be increased if your init script generates a lot of output on stdout. If not specified, the default value of 300 seconds will be used.
_DRY_RUN (optional) | Dry run mode which only validates input and generates workflow script without creating image. Disabled by default.

