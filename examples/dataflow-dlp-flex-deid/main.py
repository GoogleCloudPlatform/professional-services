# Copyright 2025 Google LLC
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#     http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.

import csv
import io
import logging
import time
from typing import Iterable, List, Dict, Optional

import apache_beam as beam
from apache_beam.options.pipeline_options import PipelineOptions
from apache_beam.options.pipeline_options import GoogleCloudOptions


class DlpDeidOptions(PipelineOptions):
    """Custom options for the DLP de-identification Flex Template."""
    @classmethod
    def _add_argparse_args(cls, parser):
        parser.add_argument("--file_pattern", required=True)
        parser.add_argument("--dataset", required=True)
        parser.add_argument("--deidentify_template_name", required=True)
        parser.add_argument("--csv_headers", default=None,
                            help="Comma-separated header names matching the CSV")
        parser.add_argument("--headers_gcs_uri", default=None,
                            help="gs:// path to a text file whose first line is the CSV header")
        parser.add_argument("--batch_size", type=int, default=500)
        parser.add_argument("--dlp_api_retry_count", type=int, default=3)
        parser.add_argument("--skip_header_lines", type=int, default=1)
        parser.add_argument("--output_table", default=None,
                            help="Output table name (defaults to output_<DLP template id>)")


def build_table_schema(headers: List[str]) -> Dict[str, List[Dict[str, str]]]:
    """Build a BigQuery schema with STRING fields for each header."""
    fields = [{"name": h, "type": "STRING", "mode": "NULLABLE"} for h in headers]
    return {"fields": fields}


def parse_headers_from_csv_line(line: str) -> List[str]:
    return next(csv.reader(io.StringIO(line)))


class DeidentifyWithDLP(beam.DoFn):
    """Batch DoFn that calls DLP deidentifyContent on a table-shaped ContentItem."""
    def __init__(self, *, headers: List[str], template_name: str, retry_count: int):
        self._headers = headers
        self._template_name = template_name
        self._retry_count = retry_count
        self._project_id = template_name.split("/")[1]
        self._dlp_client = None

    def setup(self):
        from google.cloud import dlp_v2
        self._dlp_client = dlp_v2.DlpServiceClient()

    def process(self, batch: Iterable[str]) -> Iterable[List[Dict[str, str]]]:
        rows = []
        for line in batch:
            try:
                values = next(csv.reader(io.StringIO(line)))
            except StopIteration:
                logging.warning("Skipping empty or malformed line: %r", line)
                continue
            if len(values) != len(self._headers):
                logging.warning(
                    "Skipping row with column mismatch. expected=%d actual=%d line=%r",
                    len(self._headers), len(values), line,
                )
                continue
            rows.append({"values": [{"string_value": v} for v in values]})

        if not rows:
            return

        dlp_table = {"headers": [{"name": h} for h in self._headers], "rows": rows}
        request = {
            "parent": f"projects/{self._project_id}",
            "deidentify_template_name": self._template_name,
            "item": {"table": dlp_table},
        }

        for attempt in range(self._retry_count):
            try:
                response = self._dlp_client.deidentify_content(request=request)
                output_rows: List[Dict[str, str]] = []
                for row in response.item.table.rows:
                    output_rows.append({
                        self._headers[i]: val.string_value
                        for i, val in enumerate(row.values)
                    })
                yield output_rows
                break
            except Exception as e:
                logging.warning("DLP API call failed (attempt %d/%d): %s",
                                attempt + 1, self._retry_count, e)
                if attempt < self._retry_count - 1:
                    time.sleep(2 ** attempt)
                else:
                    logging.error("All retries failed for batch (first row shown): %r",
                                  batch[0] if batch else None)


def run():
    options = PipelineOptions(save_main_session=True, streaming=False)
    opts = options.view_as(DlpDeidOptions)
    gcp = options.view_as(GoogleCloudOptions)

    # Resolve headers from parameters
    headers: Optional[List[str]] = None
    if opts.csv_headers:
        headers = [h.strip() for h in opts.csv_headers.split(",") if h.strip()]
    elif opts.headers_gcs_uri:
        from google.cloud import storage
        if not opts.headers_gcs_uri.startswith("gs://"):
            raise ValueError("headers_gcs_uri must be a gs:// path")
        _, path = opts.headers_gcs_uri.split("gs://", 1)
        bucket_name, _, object_path = path.partition("/")
        client = storage.Client()
        data = client.bucket(bucket_name).blob(object_path).download_as_text()
        first_line = data.splitlines()[0] if data else ""
        headers = parse_headers_from_csv_line(first_line)
    else:
        raise ValueError("Provide either --csv_headers or --headers_gcs_uri")

    if not headers:
        raise ValueError("No CSV headers resolved")

    # Default output table naming: output_<templateId>
    template_suffix = opts.deidentify_template_name.split("/")[-1]
    output_table = opts.output_table or f"output_{template_suffix}"

    # Determine project for BigQuery sink
    bq_project = gcp.project or opts.deidentify_template_name.split("/")[1]
    table_spec = f"{bq_project}:{opts.dataset}.{output_table}"

    table_schema = build_table_schema(headers)

    with beam.Pipeline(options=options) as p:
        (
            p
            | "ReadFromGCS" >> beam.io.ReadFromText(
                opts.file_pattern, skip_header_lines=opts.skip_header_lines)
            | "BatchForDLP" >> beam.BatchElements(
                min_batch_size=opts.batch_size, max_batch_size=opts.batch_size)
            | "CallDLP" >> beam.ParDo(DeidentifyWithDLP(
                headers=headers,
                template_name=opts.deidentify_template_name,
                retry_count=opts.dlp_api_retry_count,
            ))
            | "FlattenBatches" >> beam.FlatMap(lambda rows: rows)
            | "WriteToBQ" >> beam.io.WriteToBigQuery(
                table=table_spec,
                schema=table_schema,
                write_disposition=beam.io.BigQueryDisposition.WRITE_TRUNCATE,
                create_disposition=beam.io.BigQueryDisposition.CREATE_IF_NEEDED,
            )
        )


if __name__ == "__main__":
    logging.getLogger().setLevel(logging.INFO)
    run()
