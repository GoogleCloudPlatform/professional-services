# Composer-Airflow Rotation Tool

## Overview

This script automates the process of rotating a Composer environment to a new Cloud Composer environment. It performs the following steps:

1. **Save the DAG inventory** locally and take a snapshot of the old Composer environment.
2. **Pause all DAGs** instantly in the old Composer environment to ensure no overlap in DAG runs.
3. **Load the snapshot** into the new Composer environment.

## Use Cases

While in-place updates are preferred for Composer environments (e.g., minor version updates using the Google beta-provider), there are scenarios where environment rotation is unavoidable:

- Changing network configurations like tags, VPC networks, or IP ranges.
- Updating the encryption key.
- Resolving an unhealthy environment status that doesn't go away.
- downgrading environment versions
- migrating resources to a new region

Safe updates that do **not** require environment rotation include:

- Modifying labels.
- Updating software configurations such as image versions, PyPI packages, and environment variables.
- Adjusting workload configurations like the scheduler and triggerer.

## Prerequisites

- Ensure you have the Google Cloud SDK (`gcloud`) installed and configured.
- Have appropriate permissions to manage Composer environments and Cloud Storage.
- The `pause_all_dags.py` script should be available in the `dags/` directory.

## Usage

The script accepts the following arguments:

1. `-p`: **Project ID** where Composer is deployed.
2. `-c`: **Old Composer Environment Name**.
3. `-l`: **Old Composer Environment Location**.
4. `-C`: **New Composer Environment Name**.
5. `-L`: **New Composer Environment Location**.
6. `-g`: **GCS Location for Snapshot** (e.g., `gs://your-bucket/composer-snapshots/`).
7. `-d`: **Old DAG Folder** (GCS path to the DAG folder of the old environment).

### Example

```bash
./rotate-composer.sh \
  -p "your-project-id" \
  -c "old-composer-env" \
  -l "us-central1" \
  -C "new-composer-env" \
  -L "us-central1" \
  -g "gs://your-bucket/composer-snapshots/" \
  -d "gs://your-old-dag-folder-path"
```

### Argument Details

- **`-p` (Project ID):** The Google Cloud project ID where the Composer environments are deployed.
- **`-c` (Old Composer Environment Name):** The name of the Composer environment you wish to rotate from.
- **`-l` (Old Composer Environment Location):** The region of the old Composer environment.
- **`-C` (New Composer Environment Name):** The name of the new Composer environment you wish to rotate to.
- **`-L` (New Composer Environment Location):** The region of the new Composer environment.
- **`-g` (GCS Location for Snapshot):** The Cloud Storage bucket path where the snapshot of the old environment will be stored.
- **`-d` (Old DAG Folder):** The Cloud Storage path to the DAG folder of the old Composer environment.

## Script Steps

1. **Begin Rotation:**
   - The script starts by printing a message indicating the rotation process has begun.

2. **Save Airflow DAG Inventory:**
   - Runs `gcloud composer environments run` to list all DAGs in the old environment.
   - Saves the inventory to a local file named `${OLD_COMPOSER_ENV}_${OLD_COMPOSER_LOCATION}_inventory`.

3. **Save Snapshot of Old Environment:**
   - Uses `gcloud beta composer environments snapshots save` to create a snapshot.
   - Stores the snapshot in the specified GCS location.

4. **Upload `pause_all_dags.py` DAG:**
   - Copies the `pause_all_dags.py` script to the old environment's DAG folder to pause all DAGs.

5. **Wait for DAG Sync:**
   - Polls the old environment to check if the `pause_all_dags` DAG is available and not paused.
   - Continues checking every 15 seconds until the DAG is ready.

6. **Trigger `pause_all_dags` DAG:**
   - Triggers the `pause_all_dags` DAG to pause all other DAGs in the old environment.

7. **Remove `pause_all_dags.py` DAG:**
   - Removes the `pause_all_dags.py` script from the old environment's DAG folder.

8. **Load Snapshot into New Environment:**
   - Uses `gcloud beta composer environments snapshots load` to load the snapshot into the new environment.

9. **Complete Rotation:**
   - Prints a completion message indicating the rotation is complete.

## Notes

- The script uses `set -e` to exit immediately if a command exits with a non-zero status.
- Ensure that the `pause_all_dags.py` script is available in the `dags/` directory from which the script is run.
- The rotation process can take up to **30 minutes** to complete.
- After the rotation, update any external services or configurations that point to the old Composer environment.

## Troubleshooting

- **Permission Errors:**
  - Ensure you have the necessary IAM permissions for Composer and Cloud Storage operations.
- **Environment Variables:**
  - Double-check that all environment variables and configurations are correctly set in the new Composer environment.
- **DAG Synchronization Issues:**
  - If the script hangs while waiting for the `pause_all_dags` DAG to sync, verify that the DAG was correctly copied to the old environment's DAG folder.
