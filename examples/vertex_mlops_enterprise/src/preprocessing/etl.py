# Copyright 2023 Google LLC
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#      http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.
"""Data preprocessing pipelines."""

import os

import tensorflow_transform as tft
import tensorflow_data_validation as tfdv
import apache_beam as beam
import tensorflow_transform.beam as tft_beam
from tensorflow_transform.tf_metadata import dataset_metadata
from tensorflow_transform.tf_metadata import schema_utils


from src.preprocessing import transformations

RAW_SCHEMA_LOCATION = "src/raw_schema/schema.pbtxt"


def parse_bq_record(bq_record):
    output = {}
    for key in bq_record:
        output[key] = [bq_record[key]]
    return output


def split_dataset(bq_row, num_partitions, ratio):
    import json

    assert num_partitions == len(ratio)
    bucket = sum(map(ord, json.dumps(bq_row))) % sum(ratio)
    total = 0
    for i, part in enumerate(ratio):
        total += part
        if bucket < total:
            return i
    return len(ratio) - 1


def run_transform_pipeline(args):

    pipeline_options = beam.pipeline.PipelineOptions(flags=[], **args)

    raw_data_query = args["raw_data_query"]
    write_raw_data = args["write_raw_data"]
    exported_data_prefix = args["exported_data_prefix"]
    transformed_data_prefix = args["transformed_data_prefix"]
    transform_artifact_dir = args["transform_artifact_dir"]
    temporary_dir = args["temporary_dir"]
    gcs_location = args["gcs_location"]
    project = args["project"]

    source_raw_schema = tfdv.load_schema_text(RAW_SCHEMA_LOCATION)
    raw_feature_spec = schema_utils.schema_as_feature_spec(
        source_raw_schema
    ).feature_spec

    raw_metadata = dataset_metadata.DatasetMetadata(
        schema_utils.schema_from_feature_spec(raw_feature_spec)
    )

    with beam.Pipeline(options=pipeline_options) as pipeline:
        with tft_beam.Context(temporary_dir):

            # Read raw BigQuery data.
            raw_train_data, raw_eval_data = (
                pipeline
                | "Read Raw Data"
                >> beam.io.ReadFromBigQuery(
                    query=raw_data_query,
                    project=project,
                    use_standard_sql=True,
                    gcs_location=gcs_location,
                )
                | "Parse Data" >> beam.Map(parse_bq_record)
                | "Split" >> beam.Partition(split_dataset, 2, ratio=[8, 2])
            )

            # Create a train_dataset from the data and schema.
            raw_train_dataset = (raw_train_data, raw_metadata)

            # Analyze and transform raw_train_dataset to produced transformed_train_dataset and transform_fn.
            transformed_train_dataset, transform_fn = (
                raw_train_dataset
                | "Analyze & Transform"
                >> tft_beam.AnalyzeAndTransformDataset(transformations.preprocessing_fn)
            )

            # Get data and schema separately from the transformed_dataset.
            transformed_train_data, transformed_metadata = transformed_train_dataset

            # write transformed train data.
            _ = (
                transformed_train_data
                | "Write Transformed Train Data"
                >> beam.io.tfrecordio.WriteToTFRecord(
                    file_path_prefix=os.path.join(
                        transformed_data_prefix, "train/data"
                    ),
                    file_name_suffix=".gz",
                    coder=tft.coders.ExampleProtoCoder(transformed_metadata.schema),
                )
            )

            # Create a eval_dataset from the data and schema.
            raw_eval_dataset = (raw_eval_data, raw_metadata)

            # Transform raw_eval_dataset to produced transformed_eval_dataset using transform_fn.
            transformed_eval_dataset = (
                raw_eval_dataset,
                transform_fn,
            ) | "Transform" >> tft_beam.TransformDataset()

            # Get data from the transformed_eval_dataset.
            transformed_eval_data, _ = transformed_eval_dataset

            # write transformed train data.
            _ = (
                transformed_eval_data
                | "Write Transformed Eval Data"
                >> beam.io.tfrecordio.WriteToTFRecord(
                    file_path_prefix=os.path.join(transformed_data_prefix, "eval/data"),
                    file_name_suffix=".gz",
                    coder=tft.coders.ExampleProtoCoder(transformed_metadata.schema),
                )
            )

            # Write transform_fn.
            _ = transform_fn | "Write Transform Artifacts" >> tft_beam.WriteTransformFn(
                transform_artifact_dir
            )

            if write_raw_data:
                # write raw eval data.
                _ = (
                    raw_eval_data
                    | "Write Raw Eval Data"
                    >> beam.io.tfrecordio.WriteToTFRecord(
                        file_path_prefix=os.path.join(exported_data_prefix, "data"),
                        file_name_suffix=".tfrecord",
                        coder=tft.coders.ExampleProtoCoder(raw_metadata.schema),
                    )
                )


def convert_to_jsonl(bq_record):
    import json

    output = {}
    for key in bq_record:
        output[key] = [bq_record[key]]
    return json.dumps(output)


def run_extract_pipeline(args):

    pipeline_options = beam.pipeline.PipelineOptions(flags=[], **args)

    sql_query = args["sql_query"]
    exported_data_prefix = args["exported_data_prefix"]
    temporary_dir = args["temporary_dir"]
    gcs_location = args["gcs_location"]
    project = args["project"]

    with beam.Pipeline(options=pipeline_options) as pipeline:
        with tft_beam.Context(temporary_dir):

            # Read BigQuery data.
            raw_data = (
                pipeline
                | "Read Data"
                >> beam.io.ReadFromBigQuery(
                    query=sql_query,
                    project=project,
                    use_standard_sql=True,
                    gcs_location=gcs_location,
                )
                | "Parse Data" >> beam.Map(convert_to_jsonl)
            )

            # Write raw data to GCS as JSONL files.
            _ = raw_data | "Write Data" >> beam.io.WriteToText(
                file_path_prefix=exported_data_prefix, file_name_suffix=".jsonl"
            )


def parse_prediction_results(jsonl):
    import uuid
    import json

    prediction_results = json.loads(jsonl)["prediction"]
    prediction_id = str(uuid.uuid4())
    scores = prediction_results["scores"]
    classes = prediction_results["classes"]

    return {"prediction_id": prediction_id, "scores": scores, "classes": classes}
