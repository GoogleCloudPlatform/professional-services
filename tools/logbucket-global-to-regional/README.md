# Change _Default sink destination to regional log buckets

## Background
Currently when logging API is enabled in a project it creates two log buckets: _Required and _Default. These log buckets are created in a Global region, and customers with data locality restriction may not want to store their logs in a **Global** location.

Read more: https://cloud.google.com/logging/docs/routing/overview#buckets

This behaviour can be changed by setting an organization level setting that restricts the log bucket creation to a specefic region. **However, these settings are applied only for any newly created projects and doesn't change the log bucket location for existing projects.**

Read more: https://cloud.google.com/logging/docs/default-settings

In some cases, customers may not have set these organization level setting and would want to change the log bucket's location to a specific region.

Read more: https://cloud.google.com/logging/docs/regionalized-logs

**NOTE: _Required log bucket region can NOT be changed once they are created. This utility only works for _Default**

## Solution
This utility helps in reconfiguring the _Default sink to send logs to a newly created regional Default bucket.

There are 2 parts to this utility:
1. list_all_projects --> This function takes an Organization ID and scans through all the folders and sub folders to generate a list of projects within the organization
2. create_bucket_update_sink --> This function takes a list of projects and reconfigures the _Default sink

If you already have a list of projects where you want to reconfigure the _Default sink, you can disable project listing by setting  "list_projects = False" in the file **user_inputs.py**.

**NOTE: You can't move the existing logs from Global log buckets to the newly created regional log buckets. You can create log views to include both old and new buckets.**

## Permissions and Roles Required 
The principal running the utility needs the below roles attached to them at the **organization level**.
1. roles/resourcemanager.organizationViewer
2. roles/resourcemanager.folderViewer
3. roles/logging.admin


## Usage

1. Clone this repository or copy all the files in this directory to the VM where you want to execute. 
2. Install the Google Cloud Python modules:
    ```bash
    pip3 install -r requirements.txt
    ```
3. Ensure that the principal running this script has the required roles are mentioned above.
4. In the **user_inputs.py** file provide the below varaibles:
   * log_bucket_region --> Region where new log bucket needs to be created. Eg: us-central1
   * log_bucket_name --> Log bucket name for new log bucket, generally "Default".
   * organization_id --> Your GCP Organization ID
   * list_projects --> Boolean. If **False**: list_all_projects won't run and you'll need to provide the list of project in **projectListFile**
   * exclude_folders = {"123456", "123455678"} --> A set. If you don't want certain folders to be scanned for projects, you can skip.
   * exclude_projects = {"project_id1", "project_id2"} --> A set. If you don't want certain projects to be listed, you can skip.
   * projectListFile = "Path/To/Your/Project_List_File.txt" --> If you already have a project list, provide the  projects list file location. See sample_projectid.txt for an example file. 
4. Run the utility
   ```bash
   python3 main.py
   ```
