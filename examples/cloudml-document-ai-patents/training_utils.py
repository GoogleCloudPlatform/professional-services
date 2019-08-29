"""General utilities to train AutoML models."""

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

import abc
import datetime
import logging
import math
import os
import re
import regex
import shutil
import subprocess

import pandas as pd

from google.cloud import bigquery, vision, storage
from google.cloud import automl_v1beta1 as automl
from google.cloud.automl_v1beta1 import enums
from wand.image import Image


logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

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
  """Matching function specific to Int. Classification.
  When we get several matches, we return the first match after the position of
  IntCl for classification.

  Note: we use r'Int\.? C[I|L|1]' as keyword pattern.
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

    # To handle OCR issues
    search_value = search_value.replace("0", r"[0|o|q]")
    search_value = search_value.replace("7", r"[7|z]")
    search_value = search_value.replace("6", r"[6|o]")
    search_value = search_value.replace("q ", r"[q|0]\s")
    search_value = search_value.replace("/", r"[/|1|7|\.]")

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

    r = regex.compile("(%s){e<=%i}"%(search_value, self._tolerance),
                      flags=regex.BESTMATCH)
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

    search_value = search_value.replace(r";", r"[;|:]")
    search_value = search_value.replace(r"(", r"\(").replace(r")", r"\)")

    match = re.search(re.compile(search_value), pdf_text)
    if match:
      start_index = pdf_text.find(match.group(0))
      return start_index, match.group(0)


def convert_pdfs(main_project_id,
                 input_bucket_name,
                 service_acct,
                 output_directory="patent_demo_data",
                 temp_directory="./tmp/google"):
  """Converts all pdfs in a bucket to png and txt using OCR.

  Args:
    input_bucket_name (string): Bucket of Public PDFs
    output_bucket_name (string): Bucket for Converted PNGs
    temp_directory (string): Temporary Local Directory for coversion
  """

  # Create temporary directory
  if not os.path.exists(temp_directory):
    os.makedirs(temp_directory)

  # Prepare PDFs for Image Classification/Object Detection
  logger.info("Downloading PDFs for processing.")
  subprocess.run(
    f"gsutil -m cp gs://{input_bucket_name}/*.pdf {temp_directory}", shell=True)

  for f in os.scandir(temp_directory):
    if f.name.endswith(".pdf"):
      logger.info(f"Converting {f.name} to PNG")
      temp_png = f.path.replace(".pdf", ".png")
      with Image(filename=f.path, resolution=300) as pdf:
        with pdf.convert("png") as png:
          png.save(filename=temp_png)

  logger.info(f"Uploading png file to GCS.")
  output_bucket_name = main_project_id + "-vcm"

  # Create Bucket if it doesn"t exist
  subprocess.run(
      f"gsutil mb -p {main_project_id} gs://{output_bucket_name}",
      shell=True)

  subprocess.run(
      f"gsutil -m cp {temp_directory}/*.png gs://{output_bucket_name}/{output_directory}/png",
      shell=True)

  # OCR Processing to obtain text files
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
                         region,
                         output_directory="patent_demo_data"):
  """Create AutoML model for image classification."""

  logger.info(f"Beginning AutoML image classification process.")

  # Create training data
  output_bucket_name = main_project_id + "-vcm"
  dest_uri = f"gs://{output_bucket_name}/{output_directory}/image_classification.csv"

  df = bq_to_df(data_project_id, dataset_id, table_id, service_acct)
  output_df = df.replace({
    input_bucket_name: output_bucket_name + f"/{output_directory}/png",
    r"\.pdf": ".png"
  }, regex=True, inplace=False)

  # Get Classification Columns
  output_df = output_df[["gcs_path", "issuer"]]
  output_df.to_csv(dest_uri, header=False, index=False)

  now = datetime.datetime.now().strftime("_%m%d%Y_%H%M%S")
  dataset_metadata = {
    "display_name": output_directory + now,
    "image_classification_dataset_metadata": {
      "classification_type": "MULTICLASS"
    }
  }

  model_metadata = {
    "display_name": output_directory + now,
    "dataset_id": None,
    "image_classification_model_metadata": {"train_budget": 1}
  }

  # Create AutoML model for image classification
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
                     region,
                     output_directory="patent_demo_data"):
  """Create AutoML model for object detection."""
  logger.info(f"Beginning AutoML object detection process.")

  # Create training data
  output_bucket_name = main_project_id + "-vcm"
  dest_uri = f"gs://{output_bucket_name}/{output_directory}/object_detection.csv"

  df = bq_to_df(data_project_id, dataset_id, table_id, service_acct)
  df.replace({
    input_bucket_name: output_bucket_name + f"/{output_directory}/png",
    r"\.pdf": ".png"
  }, regex=True, inplace=True)

  # Add Columns for AutoML training data
  df.insert(loc=0, column="set", value="UNASSIGNED")
  df.insert(loc=2, column="label", value="FIGURE")
  df.insert(loc=5, column="", value="", allow_duplicates=True)
  df.insert(loc=6, column="", value="", allow_duplicates=True)
  df.insert(loc=9, column="", value="", allow_duplicates=True)
  df.insert(loc=10, column="", value="", allow_duplicates=True)
  df.to_csv(dest_uri, header=False, index=False)

  now = datetime.datetime.now().strftime("_%m%d%Y_%H%M%S")
  dataset_metadata = {
    "display_name": output_directory + now,
    "image_object_detection_dataset_metadata": {},
  }

  model_metadata = {
    "display_name": output_directory + now,
    "dataset_id": None,
    "image_object_detection_model_metadata": {}
  }

  # Create AutoML model for object detection
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
                        region,
                        output_directory="patent_demo_data"):
  """Create AutoML model for text classification. """
  logger.info(f"Starting AutoML text classification.")

  # Create training data
  output_bucket_name = main_project_id + "-lcm"
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
  output_df = output_df[["gcs_path", "invention_type"]]
  output_df.to_csv(dest_uri, header=False, index=False)

  now = datetime.datetime.now().strftime("_%m%d%Y_%H%M%S")
  dataset_metadata = {
    "display_name": output_directory + now,
    "text_classification_dataset_metadata": {
      "classification_type": "MULTICLASS"
    }
  }

  model_metadata = {
    "display_name": output_directory + now,
    "dataset_id": None,
    "text_classification_model_metadata": {}
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
                      config,
                      output_directory="patent_demo_data",
                      temp_directory = "./tmp/google"):
  """Create AutoML entity extraction model."""
  logger.info(f"Starting AutoML entity extraction.")
  
  # Create training data
  output_bucket_name = main_project_id + "-lcm"
  dest_uri = f"gs://{output_bucket_name}/{output_directory}/entity_extraction.csv"

  df = bq_to_df(project_id=data_project_id,
                dataset_id=dataset_id,
                table_id=table_id,
                service_acct=service_acct)
  fields_to_extract = config["model_ner"]["fields_to_extract"]
  field_names = [field["field_name"] for field in fields_to_extract]
  df = df[field_names]
  df_dict = df.to_dict("records")

  LIST_JSONL = []
  for _index in range(0, len(df)):
    txt_file = df_dict[_index].pop("gcs_path").replace(".pdf", ".txt")
    txt_file = txt_file.replace(f"gs://{input_bucket_name}/",
                                f"{temp_directory}/")
    with open(txt_file, "r") as f:
      _text = f.read()
      jsonl = create_jsonl(_text, df_dict[_index])
      LIST_JSONL.append(jsonl)

  save_jsonl_content(jsonl="\n".join(LIST_JSONL),
    full_gcs_path = f"gs://{output_bucket_name}/{output_directory}/entity_extraction.jsonl",
                     service_acct=service_acct)
  save_jsonl_content(jsonl=f", gs://{output_bucket_name}/{output_directory}/entity_extraction.jsonl",
                     full_gcs_path=dest_uri,
                     service_acct=service_acct)

  # Set dataset name and metadata.
  now = datetime.datetime.now().strftime("_%m%d%Y_%H%M%S")
  dataset_metadata = {
    "display_name": output_directory + now,
    "text_extraction_dataset_metadata": {}
  }

  # Set model name and model metadata for the dataset.
  model_metadata = {
    "display_name": output_directory + now,
    "dataset_id": None,
    "text_extraction_model_metadata": {}
  }

  # Create AutoML model for entity extraction
  create_automl_model(main_project_id,
                      region,
                      dataset_metadata,
                      model_metadata,
                      dest_uri,
                      service_acct)

  # Remove all files in the temporary directory
  shutil.rmtree(temp_directory)


def bq_to_df(project_id, dataset_id, table_id, service_acct):
  """Fetches Data From BQ Dataset, outputs as dataframe."""

  client = bigquery.Client.from_service_account_json(service_acct)
  table = client.get_table(f"{project_id}.{dataset_id}.{table_id}")
  df = client.list_rows(table).to_dataframe()
  return df


def run_ocr(project_id, output_directory, temp_directory, service_acct):
  """Process png files using OCR to extract text from documents."""

  logger.info("Processing documents with Cloud Vision API")

  vision_client = vision.ImageAnnotatorClient.from_service_account_file(
    service_acct)

  image = vision.types.Image()

  storage_client = storage.Client.from_service_account_json(service_acct)
  blobs = storage_client.list_blobs(f"{project_id}-vcm", prefix=output_directory + "/png")

  # make sure bucket exists
  output_bucket_name = project_id + "-lcm"
  subprocess.run(
    f"gsutil mb -p {project_id} gs://{output_bucket_name}", shell=True)

  for blob in blobs:
    if blob.name.endswith(".png"):

      logger.info(f"Processing OCR for {blob.name}.")

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
  """Create dataset, import data, create model."""

  client = automl.AutoMlClient.from_service_account_json(service_acct)

  # A resource that represents Google Cloud Platform location.
  project_location = client.location_path(project_id, compute_region)

  # Create a dataset with the dataset metadata in the region.
  logger.info("Creating dataset...")
  dataset = client.create_dataset(project_location, dataset_metadata)

  logger.info("Importing Data. This may take a few minutes.")
  # Import data from the input URI.
  response = client.import_data(dataset.name, {
    "gcs_source": {
      "input_uris": [path]
    }
  })

  logger.info(f"Data imported. {response.result()}")

  # Set dataset_id into model metadata
  model_metadata["dataset_id"] = dataset.name.split("/")[-1]

  logger.info("Training model...")
  response = client.create_model(project_location, model_metadata)
  logger.info(f"Training operation name: {response.operation.name}")
  logger.info("Training started. This will take a while.")


def create_jsonl(pdf_text, value_dict):
  """Constructs the jsonl for a given pdf.

  Args:
    pdf_text: Text of the pdf.
    value_dict: a dictionary of fieldname: fieldvalue.
  Returns:
    jsonl file suitable for training AutoML NER model
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
      if start_index != -1:
        end_index = start_index + len(match_value)
        jsonl.append('''{{"text_extraction": {{"text_segment":{{"end_offset": {}, "start_offset": {}}}}}, "display_name": "{}"}},'''.format(
          end_index, start_index, field))

  jsonl[-1] = jsonl[-1].replace('"},', '"}')  # Remove last comma
  jsonl.append(u'''],"text_snippet":{{"content":"{}"}}}}'''.format(pdf_text.replace('\n', '\\n')))

  jsonl_final = "".join(jsonl)
  return jsonl_final


LIST_FIELDS = {
  "applicant_line_1": MatchTypo(),
  "application_number": GeneralMatch(),
  "class_international": MatchClassification(pattern_keyword_before=r"Int\.? C[I|L|1]"),
  "filing_date": MatchTypo(tolerance=1),
  "inventor_line_1": MatchTypo(),
  "number": GeneralMatch(),
  "publication_date": GeneralMatch(),
  "title_line_1": MatchTypo(),
  "number": GeneralMatch()
}

def save_jsonl_content(jsonl, full_gcs_path, service_acct):
  """Saves jsonl content to specified GCS location.

  Args:
    jsonl: jsonl file
    full_gcs_path: GCS location to upload the jsonl file
    service_acct: service account to access GCS
  """

  match = re.match(r"gs://([^/]+)/(.*)", full_gcs_path)
  bucket_name = match.group(1)
  blob_name = match.group(2)

  client = storage.Client.from_service_account_json(service_acct)
  bucket = client.get_bucket(bucket_name)
  blob_csv = bucket.blob(blob_name)

  blob_csv.upload_from_string(jsonl)
