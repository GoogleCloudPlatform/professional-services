## Train Model
1. Generate credentials
 ```sh
 gcloud auth application-default login
 ```
2. Python virtual env and few packages.
```sh
pip3 install -r requirements.txt
```
3. Create a gcs bucket folder for staging training dataset
4. Execute `trainer.py` to start training on base model (code-bison-32k)
```sh
python3 trainer.py -gcs_path gs://allspark-training-data/training_data -project_id pso-db-migrations
```
Optional Args:  
-region <gcp region>
-service_account <Service Account ID with permissions of Storage Admin and Vertex AI User>

## (Optionally) Enhance Training Dataset
1. Make a copy of existing [training sheet](https://docs.google.com/spreadsheets/d/1UocNd4Xe28NzaEUdCsoNvPo56eKUxaBCogYF9Yml9iA/edit)
2. If new tab is created, ensure it follows the naming convention "Language: Source to Target"
3. Add new Input and Output for training data.
4. Generate credentials
```sh
 gcloud auth application-default login --scopes="openid,https://www.googleapis.com/auth/cloud-platform,https://www.googleapis.com/auth/spreadsheets"
 ```
5. Execute `python3 googlesheet-to-jsonl.py -gsheet_url <sheet_url>   
Eg:
```sh
python3 googlesheet-to-jsonl.py -gsheet_url https://docs.google.com/spreadsheets/d/1UocNd4Xe28NzaEUdCsoNvPo56eKUxaBCogYF9Yml9iA/edit
```




