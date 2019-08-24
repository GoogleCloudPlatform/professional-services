# Copyright 2019 Google LLC
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#    http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.

import os
import shutil
import datetime
import pandas as pd
import subprocess
import re
import regex
import math

from google.cloud import bigquery, vision, storage, automl_v1beta1 as automl
from google.cloud.automl_v1beta1 import enums
from wand.image import Image

import abc

class MatchFunction(object):
    
    @abc.abstractmethod
    def __init__(self, kwargs):
        return
    
    @abc.abstractmethod
    def find_match(self, pdf_text, search_value):
        # A match function should return a start position and the matched string.
        return


class GeneralMatch(MatchFunction):    
    def __init__(self):
        pass

    def find_match(self, pdf_text, search_value):
        pdf_text = pdf_text.lower()
        search_value = str(search_value).lower()
        
        match = re.search(re.compile(search_value), pdf_text)
        if match:
            start_index = pdf_text.find(match.group(0))
            return start_index, match.group(0)

class MatchClassification(MatchFunction):
    """Matching function specific to US and Int. Classification.
    
    This field is more complicated as it is sometimes equal to classification 2
      or a substring of classification_2, therefore a simple match might give the wrong
      location.
    
    When we get several match, we return the first match after the position of IntCl
      for classification 1 and the the position after US CL for classification 2.
      
    Note: we use either 'Int\.? C[I|L|1]' or 'U.S. C[I|L|1]' as keyword pattern.
    """
    
    def __init__(self, pattern_keyword_before):
        self._pattern_keyword_before = pattern_keyword_before.lower()
    
    def _find_position_pattern(self, pdf_text):
        match = re.search(re.compile(self._pattern_keyword_before), pdf_text)
        if match:
            start_index = pdf_text.find(match.group(0))
            return start_index
    
    def find_match(self, pdf_text, search_value):
        
        pdf_text = pdf_text.lower()
        search_value = str(search_value).lower()
        search_value = search_value.replace('0', r'[0|o|q]')    # To handle OCR issues (0 -> O or Q)
        search_value = search_value.replace('7', r'[7|z]')      # To handle OCR issues (7 -> Z)
        search_value = search_value.replace('6', r'[6|o]')      # To handle OCR issues (6 -> O)
        search_value = search_value.replace('q ', r'[q|0]\s')   # To handle OCR issues (Q_ -> 0_)      
        search_value = search_value.replace('/', r'[/|1|7|\.]') # To handle OCR issues (/ -> 1 or 7 or .)

        
        position_pattern = self._find_position_pattern(pdf_text)
        if position_pattern:
            for match in re.finditer(re.compile(search_value), pdf_text):
                if match.start() > position_pattern:
                    return match.start(), match.group()

class MatchTypo(MatchFunction):
    
    def __init__(self, tolerance=2):
        self._tolerance = tolerance
    
    def find_match(self, pdf_text, search_value):       
        pdf_text = pdf_text.lower()
        search_value = str(search_value).lower()

        r = regex.compile('(%s){e<=%i}'%(search_value, self._tolerance), flags=regex.BESTMATCH)
        match = r.search(pdf_text)
        if match:
            match_value = match.group(0)
            start_index = pdf_text.find(match_value)
            return start_index, match_value

class MatchApplicant(MatchFunction):
    def __init__(self):
        pass
    
    def find_match(self, pdf_text, search_value):
        pdf_text = pdf_text.lower()
        search_value = str(search_value).lower()

        search_value = search_value.replace(r';', r'[;|:]')
        search_value = search_value.replace(r'(', r'\(').replace(r')', r'\)')

        match = re.search(re.compile(search_value), pdf_text)
        if match:
            start_index = pdf_text.find(match.group(0))
            return start_index, match.group(0)



now = datetime.datetime.now().strftime("_%m%d%Y_%H%M%S")


def convert_pdfs(main_project_id,
                 input_bucket_name,
                 service_acct):
    """Converts all pdfs in a bucket to png and txt using OCR.

    Args:
      input_bucket_name (string): Bucket of Public PDFs
      output_bucket_name (string): Bucket for Converted PNGs
      temp_directory (string): Temporary Local Directory for coversion
    """

    
    # Create temp directory & all intermediate directories
    temp_directory = "./tmp/google"
    if not os.path.exists(temp_directory):
        os.makedirs(temp_directory)

    # Prepare PDFs for Image Classification/Object Detection
    print("Downloading PDFs")

    # TODO: need to make sure folder exists
    subprocess.run(
        f'gsutil -m cp gs://{input_bucket_name}/*.pdf {temp_directory}', shell=True)

    for f in os.scandir(temp_directory):
        if f.name.endswith(".pdf"):
            print(f"Converting {f.name} to PNG")
            temp_png = f.path.replace('.pdf', '.png')
            with Image(filename=f.path, resolution=300) as pdf:
                with pdf.convert('png') as png:
                    png.save(filename=temp_png)

    print(f"Uploading to GCS")
    output_bucket_name = main_project_id + "-vcm"
    output_directory = "patent_demo_data"

    # Create Bucket if it doesn't exist
    subprocess.run(f'gsutil mb -p {main_project_id} gs://{output_bucket_name}',
                   shell=True)

    subprocess.run(f'gsutil -m cp {temp_directory}/*.png gs://{output_bucket_name}/{output_directory}/png',
                   shell=True)

    
    # Move Text Classification Preparation Here
    run_ocr(project_id=main_project_id, 
            output_directory=output_directory, 
            temp_directory=temp_directory, 
            service_acct=service_acct)


def image_classification(main_project_id,
                         data_project_id,
                         dataset_id,
                         table_id,
                         service_acct,
                         input_bucket_name,
                         region):

    print(f"Processing image_classification")

    output_bucket_name = main_project_id + "-vcm"
    output_directory = "patent_demo_data"

    dest_uri = f"gs://{output_bucket_name}/{output_directory}/image_classification.csv"

    df = bq_to_df(data_project_id, dataset_id, table_id, service_acct)

    output_df = df.replace({
        input_bucket_name: output_bucket_name + f"/{output_directory}/png",
        r"\.pdf": ".png"
    }, regex=True, inplace=False)

    # Get Classification Columns
    output_df = output_df[["file", "issuer"]]
    output_df.to_csv(dest_uri, header=False, index=False)

    dataset_metadata = {
        "display_name": "patent_demo_data" + str(now),
        "image_classification_dataset_metadata": {
            "classification_type": "MULTICLASS"
        }
    }

    model_metadata = {
        'display_name': "patent_demo_data" + str(now),
        'dataset_id': None,
        'image_classification_model_metadata': {"train_budget": 1}
    }

    create_automl_model(main_project_id,
                        region,
                        dataset_metadata,
                        model_metadata,
                        dest_uri,
                        service_acct)


def object_detection(main_project_id,
                     data_project_id,
                     dataset_id,
                     table_id,
                     service_acct,
                     input_bucket_name,
                     region):

    output_bucket_name = main_project_id + "-vcm"
    output_directory = "patent_demo_data"

    dest_uri = f"gs://{output_bucket_name}/{output_directory}/object_detection.csv"

    print(f"Processing object_detection")

    df = bq_to_df(data_project_id, dataset_id, table_id, service_acct)

    df.replace({
        input_bucket_name: output_bucket_name + f"/{output_directory}/png",
        r"\.pdf": ".png"
    }, regex=True, inplace=True)

    # Add Columns for AutoML
    # AutoML automatically splits data into Train, Test, Validation Sets
    df.insert(loc=0, column="set", value="UNASSIGNED")
    df.insert(loc=2, column="label", value="FIGURE")

    df.insert(loc=5, column="", value="", allow_duplicates=True)
    df.insert(loc=6, column="", value="", allow_duplicates=True)
    df.insert(loc=9, column="", value="", allow_duplicates=True)
    df.insert(loc=10, column="", value="", allow_duplicates=True)

    df.to_csv(dest_uri, header=False, index=False)

    dataset_metadata = {
        'display_name': 'patent_demo_data' + now,
        'image_object_detection_dataset_metadata': {},
    }

    model_metadata = {
        'display_name': "patent_demo_data" + now,
        'dataset_id': None,
        'image_object_detection_model_metadata': {}
    }

    create_automl_model(main_project_id,
                        region,
                        dataset_metadata,
                        model_metadata,
                        dest_uri,
                        service_acct)


def text_classification(main_project_id,
                        data_project_id,
                        dataset_id,
                        table_id,
                        service_acct,
                        input_bucket_name,
                        region):

    print(f"Starting AutoML text_classification.")

    output_bucket_name = main_project_id + "-lcm"
    output_directory = "patent_demo_data"

    # Create .csv file for importing data
    dest_uri = f"gs://{output_bucket_name}/{output_directory}/text_classification.csv"

    df = bq_to_df(project_id=data_project_id,
                  dataset_id=dataset_id,
                  table_id=table_id,
                  service_acct=service_acct)

    output_df = df.replace({
        input_bucket_name: output_bucket_name + f"/{output_directory}/txt",
        r"\.pdf": ".txt"
    }, regex=True, inplace=False)

    # Get text classification columns
    output_df = output_df[["file", "class"]]
    output_df.to_csv(dest_uri, header=False, index=False)

    dataset_metadata = {
        "display_name": "patent_data" + str(now),
        "text_classification_dataset_metadata": {
            "classification_type": "MULTICLASS"
        }
    }

    model_metadata = {
        'display_name': "patent_data" + str(now),
        'dataset_id': None,
        'text_classification_model_metadata': {}
    }

    # Create AutoML model for text classification
    create_automl_model(project_id=main_project_id,
                        compute_region=region,
                        dataset_metadata=dataset_metadata,
                        model_metadata=model_metadata,
                        path=dest_uri,
                        service_acct=service_acct)


def entity_extraction(main_project_id,
                      data_project_id,
                      dataset_id,
                      table_id,
                      service_acct,
                      input_bucket_name,
                      region,
                      config):
    
    # Create training data
    output_bucket_name = main_project_id + "-lcm"
    output_directory = "patent_demo_data"
    temp_directory = "./tmp/google"

    dest_uri = f"gs://{output_bucket_name}/{output_directory}/entity_extraction.csv"

    df = bq_to_df(project_id=data_project_id,
                  dataset_id=dataset_id,
                  table_id=table_id,
                  service_acct=service_acct)
    
    fields_to_extract = config['model_ner']['fields_to_extract']
    field_names = [field['field_name'] for field in fields_to_extract]
    df = df[field_names]
    df_dict = df.to_dict("records")

    LIST_JSONL = []
    for _index in range(0, len(df)):
        txt_file = df_dict[_index].pop("file").replace('.pdf', '.txt')
        txt_file = txt_file.replace(f'gs://{input_bucket_name}/', f"{temp_directory}")
        with open(txt_file, "r") as f:
            _text = f.read()
            jsonl = create_jsonl(_text, df_dict[_index])
            LIST_JSONL.append(jsonl)

    save_jsonl_content(jsonl="\n".join(LIST_JSONL),
        full_gcs_path=f"gs://{output_bucket_name}/{output_directory}/entity_extraction.jsonl",
        service_acct=service_acct)
    save_jsonl_content(jsonl=f", gs://{output_bucket_name}/{output_directory}/entity_extraction.jsonl",
        full_gcs_path=dest_uri,
        service_acct=service_acct)

    # Set dataset name and metadata.
    dataset_metadata = {
        "display_name": "patent_demo_data" + now,
        "text_extraction_dataset_metadata": {}
    }

    # Set model name and model metadata for the dataset.
    model_metadata = {
        "display_name": "patent_demo_data" + now,
        "dataset_id": None,
        "text_extraction_model_metadata": {}
    }

    create_automl_model(main_project_id,
                        region,
                        dataset_metadata,
                        model_metadata,
                        dest_uri,
                        service_acct)

    # Remove all files in the temporary directory
    shutil.rmtree(temp_directory)


def bq_to_df(project_id, dataset_id, table_id, service_acct):
    """Fetches Data From BQ Dataset, outputs as dataframe
    """
    client = bigquery.Client.from_service_account_json(service_acct)
    table = client.get_table(f"{project_id}.{dataset_id}.{table_id}")
    df = client.list_rows(table).to_dataframe()
    return df


def run_ocr(project_id, output_directory, temp_directory, service_acct):

    print("Processing Documents with Cloud Vision API")

    vision_client = vision.ImageAnnotatorClient.from_service_account_file(
        service_acct)

    image = vision.types.Image()

    storage_client = storage.Client.from_service_account_json(service_acct)
    blobs = storage_client.list_blobs(f"{project_id}-vcm", prefix=output_directory + "/png")

    # make sure bucket exists
    output_bucket_name = project_id + "-lcm"
    subprocess.run(
        f'gsutil mb -p {project_id} gs://{output_bucket_name}', shell=True)

    for blob in blobs:
        if blob.name.endswith(".png"):

            print(f"Processing {blob.name}")

            image.source.image_uri = f"gs://{project_id}-vcm/{blob.name}"
            response = vision_client.text_detection(image=image)

            # TODO Check if entity Extraction needs everything separated out
            # First text annotation is full text
            text = response.text_annotations[0].description
            temp_txt = os.path.join(
                temp_directory, os.path.basename(blob.name).replace(".png", ".txt"))

            with open(temp_txt, "w") as f:
                f.write(text)
                f.close()

    subprocess.run(
        f"gsutil -m cp {temp_directory}/*.txt gs://{project_id}-lcm/{output_directory}/txt", shell=True)


def create_automl_model(project_id,
                        compute_region,
                        dataset_metadata,
                        model_metadata,
                        path,
                        service_acct):
    """Create dataset, import data, create model, replace model id in config.yaml"""

    client = automl.AutoMlClient.from_service_account_json(service_acct)

    # A resource that represents Google Cloud Platform location.
    project_location = client.location_path(project_id, compute_region)

    # Create a dataset with the dataset metadata in the region.
    print("Creating dataset...")
    dataset = client.create_dataset(project_location, dataset_metadata)

    print("Importing Data. This may take a few minutes.")
    # Import data from the input URI.
    response = client.import_data(dataset.name, {
        "gcs_source": {
            "input_uris": [path]
        }
    })

    print(f"Data imported. {response.result()}")

    # Set dataset_id into model metadata
    model_metadata["dataset_id"] = dataset.name.split("/")[-1]

    print("Training model...")
    response = client.create_model(project_location, model_metadata)
    print(f'Training operation name: {response.operation.name}')
    print('Training started. This will take a while.')

def create_jsonl(pdf_text, value_dict):
    """Constructs the jsonl for a given pdf.
    
    Args:
      pdf_text: Text of the pdf.
      value_dict: a dictionary of fieldname: fieldvalue.
    """
    
    pdf_text = pdf_text.replace('"', '')
    jsonl = ['''{"annotations": [''']
    for field in value_dict:
        value_to_find = value_dict[field]
        
        if isinstance(value_to_find, float) and math.isnan(value_to_find):
            continue
        match_fn = LIST_FIELDS[field]
        match = match_fn.find_match(pdf_text, value_to_find)
        if match:
          start_index, match_value = match
          if (start_index != -1):
            end_index = start_index + len(match_value)
            jsonl.append('''{{"text_extraction": {{"text_segment": {{"end_offset": {}, "start_offset": {}}}}},"display_name": "{}"}},'''.format(
                end_index, start_index, field))

    jsonl[-1] = jsonl[-1].replace('"},', '"}') # Remove last comma
    jsonl.append(u'''],"text_snippet":{{"content": "{}"}}}}'''.format(pdf_text.replace('\n', '\\n')))
    
    jsonl_final = ''.join(jsonl)
    return jsonl_final

LIST_FIELDS = {
    'applicant_line_1': MatchTypo(),
    'application_number': GeneralMatch(),
    'class_international': MatchClassification(pattern_keyword_before=r'Int\.? C[I|L|1]'),
    'filing_date': MatchTypo(tolerance=1),
    'inventor_line_1': MatchTypo(),
    'number': GeneralMatch(),
    'publication_date': GeneralMatch(),
    'title_line_1': MatchTypo(),
    'number': GeneralMatch()
}

def save_jsonl_content(jsonl, full_gcs_path, service_acct): 

    match = re.match(r'gs://([^/]+)/(.*)', full_gcs_path)
    bucket_name = match.group(1)
    blob_name = match.group(2)

    client = storage.Client.from_service_account_json(service_acct)
    bucket = client.get_bucket(bucket_name)
    blob_csv = bucket.blob(blob_name)

    blob_csv.upload_from_string(jsonl)
