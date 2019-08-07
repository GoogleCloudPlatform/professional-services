
# Vision API Beta Batch PDF -> JSON

## Usage

```
python gcs_bucket_pdf_ocr.py \
--gcs-source-uri gs://{BUCKET}/{PATH_TO_PDFS} \
--gcs-destination-uri gs://{BUCKET}/{PATH_TO_OUTPUT_JSON} \
--service-account-path /path/to/service_account.json
--batch-size 100 \
--num-workers 50 \
--output-report-file ocr_report.csv
```

run `python gcs_bucket_pdf_ocr.py -h` for more information on the command line options.

The code looks at the folder in specified by `--gcs-source-uri`, finds all .pdf files in the that folder (ignoring subfolders), and attempts OCR. 

Output is written to the folder specificed by `--gcs-destination-uri`. Each source file has `pdf` removed from the end of the source filename (but the . remains), and then `output-x-to-y.json` is appended to the end. `x` is the first page in the json, and `y` is the last page, based on the pages in the source pdf. Up to 100 pages are in each json, and a source file can have more than 1 json if it has more than 100 pagegs.

`--service-account-path` is the location of a .json service account file, with GCS file creation permissions and Vision API permissions. [See this link](https://cloud.google.com/iam/docs/creating-managing-service-accounts) for information on creating service accounts.

`--batch-size` is the number of pdfs sent to the multiproccessing worker pool at once. After each batch the output report is rewritten. A new pool is not created until the current pool clears, but a timeout on the ocr vision API call ensures that the pool will clear eventually. The default is 100, but this value can be set much higher. Higher values will make the job faster, values up to a few thousand should be fine, it just means the report will be more out of date if it is being monitored (or if the job crashes).

`--num-workers` specifies the number of simultaneous workers. Each worker is a separate python process, which means more memory overhead and more stability than true multithreading. The default is 50, and care should be taken when raisisng the value--if there's a memory shortage, zombie processes can apear which will silently stall the job. `200` seems to work on an `n1-standard-8` VM, but a larger VM may be safer to use. 

`--output-report-file` is a path to a csv report written during the job. This report tracks the status of every file read from `--gcs-source-uri`, with a row per file. Each file has the following fields:
* `uri` full gs:// uri to file
* `status` status of the file:
    * `reject_extention` uri not ocred due to non-pdf extention
    * `reject_folder` uri not ocred due to not being in the given folder. includes subfolders, and files in subfolders of the given folder
    * `accept_uri` uri passed name checks, will be OCRed
    * `ocr_call_attempted` an OCR call was made, but never finished
    * `ocr_failure` an ocr call was made, but an exception was raised
    * `ocr_success` an ocr call was made with a successful response
* `response` text of the response from a successful OCR call
* `exception` text of the exception from a failed OCR call

Significant logging information is written to the console.

## Production Usage

For use on production data stores, it's helpful to run the job on a dedicated vm and save the logs and report to long-term storage. This will aid tracking data provenance in the future, as the API is updated and OCR improves. It will also allowing tracking from output files.

The general flow for the production job is to start with a fresh VM, create a virtual environment with the proper package versions, run the job and save the logs, and then upload the logs and report to GCS.

#### Create a Fresh VM and Connect

Using the `gcloud` SDK: 
```
gcloud components update
gcloud auth login
gcloud config set project {PROJECT}
gcloud config set compute/zone {ZONE}
gcloud compute instances create {VM_NAME} --machine-type n1-standard-16 
gcloud compute instances add-tags {VM_NAME} --tags=ssh
gcloud compute ssh {VM_NAME}
```

#### Setup Environment, Pull Code, and Install Packages
After connecting to the VM:
```
sudo apt-get install python-setuptools python-dev build-essention python-pip git
sudo pip install virtualenv
virtualenv --python=python2.7 ~/batch_ocr_env
source ~/batch_ocr_env/bin/activate
gcloud set project {PROJECT}
gcloud auth login
gcloud auth application-default login
gcloud source repos clone mlpilot1
cd mlpilot1/pdf_to_vision
pip install -r requirements.txt
```
You may see some errors about dependency versions (due to the beta api's requirements), but this is fine.

#### Get Service Account

You need to already have [created a service account](https://cloud.google.com/iam/docs/creating-managing-service-accounts). Once you have an account, to download the .json keyfile:
```
gcloud iam service-accounts keys create /your/path/choose-a-key-name.json \
    --iam-account SA-NAME@PROJECT-ID.iam.gserviceaccount.com
```

#### Check Your Vision API Quotas

Each worker in the vision API job will use up to 20 calls per minute. This is because of background retries, and because the quota counts pages, not pdf files. You can monitor your usage with this link (change the project id): https://console.cloud.google.com/apis/api/vision.googleapis.com/quotas?project=PROJECT_ID&duration=P30D . Keep an eye on the total Requests and Document Text Detection requests. Note that there is a delay, and sometimes beta API calls are not counted.

You can request more quota here (change the project id): https://console.cloud.google.com/iam-admin/quotas?project=PROJECT_ID&service=vision.googleapis.com . The quotas you need are overall vision API requests and document text detection requests.

#### Run Batch Job 
Run the job with `nohup` so it continues if the ssh connection is lost, and pipe the command line logs to a file. Change the gcs uris and log name, and make sure there are no line breaks in the command. You can also experiment with the batch and worker settings, though if there are too many workers the machine will run out of memory and the job will silently stall.

Here's an example
```
nohup python gcs_bucket_pdf_ocr.py --gcs-source-uri gs://bucket/path/to/folder/with/pdfs/ --gcs-destination-uri gs://bucket/path/to/folder/for/ocr/output --service-account-path  /your/path/choose-a-key-name.json --batch-size 1000 --num-workers 200 --output-report-file nice_descriptive_name_YYYY_MM_DD.csv > nice_descriptive_name_YYYY_MM_DD.log 2>&1 &
```
This will save a log to the .log file, and `nohup` keeps the job running even if the ssh session ends. It's best to monitor the job with something like `ps -all` to make sure python processes don't disconnect (if they do, `pkill python` will kill the job). 

To follow the job log in your terminal, run
```
tail -f nice_descriptive_name_YYYY_MM_DD.log
```

#### Save Job Artifacts and Clean Up
The report and log should be saved. You need to exit the virtual environment first, because some of the python packages loaded break gsutil. To upload the job artifacts to GCS (change uris as appropriate):
```
deactivate
gsutil cp nice_descriptive_name_YYYY_MM_DD.log gs://bucket/folder/for/important/logs/
gsutil cp nice_descriptive_name_YYYY_MM_DD.csv gs://mlpilot1_product/folder/for/ocr/reports
```
At this point, you can run more jobs with more source/destination folders, saving the logs for those folders as well. Once you are done running the jobs, disconnect from the VM and delete it--there's no reason to keep it around if there are no jobs to run. Exit the ssh sesion with `exit`, and then from where you ran your earlier `gcloud` commands:
```
gcloud compute instances delete ocr-batch
```




#### 

## 2016 Temp Job

2016 Package Inserts and SDSs were converted with an unfinished version of the code, now saved as `gcs_bucket_pdf_ocr_2016_only_temp.py` - a quick and dirty run to convert 2016 files only to unblock other work. 
These were the commands run:

`python gcs_bucket_pdf_ocr_2016_only_temp.py --gcs-source-uri gs://mlpilot1_product/raw_data/history_data/ecm_extracts_new/PackageInsert --gcs-destination-uri gs://mlpilot1_product/training_data/ecm_text_extracts/PKI/2016_json/ --batch-size 200`

`python gcs_bucket_pdf_ocr_2016_only_temp.py --gcs-source-uri gs://mlpilot1_product/raw_data/history_data/ecm_extracts_new/SDS --gcs-destination-uri gs://mlpilot1_product/training_data/ecm_text_extracts/SDS/2016_json --batch-size 200`


## Files

#### Active Files
`requirements.txt` - required package dependencies
`gcs_bucket_pdf_ocr.py` - main ocr batch job runner

#### Legacy Code
`gcs_bucket_pdf_ocr_2016_only_temp.py` - see section "2016 Temp Job"
`Queued_scaled_VisionAPI_pdf_to_text_v5_cloud_debug.py` - newest version of older working code
`Queued_scaled_VisionAPI_pdf_to_text_v5_cloud_pricing.py` - copied from root, an older version of the older working code
