import re
from typing import List

from apache_beam import DoFn
from apache_beam import ParDo
import apache_beam as beam
from apache_beam.io import ReadFromText
from apache_beam.io import WriteToText
from apache_beam.options.pipeline_options import PipelineOptions


class EscapeDoubleQuotes(DoFn):
  def process(self, element) -> List[str]:
    """Escapes double quotes in a string, except for specific cases.

    This function escapes double quotes within a string, excluding those:
      - At the beginning of the string
      - At the end of the string
      - Followed by a comma
      - Preceded by a comma

    Args:
        element: The input string to escape quotes in.

    Returns:
        The input string with specific double quotes escaped using a backslash (\).
    """
    return [re.sub(r'(?<!^)(?<![,])"(?!$)(?![,])', "\"\"", element)]

def create_pipeline(argv=None):
  """Creates a Dataflow pipeline that reads from GCS, escapes quotes, and writes to GCS.
  """
  # Parse the pipeline options passed into the application.
  class MyOptions(PipelineOptions):
    @classmethod
    # Define a custom pipeline option that specfies the Cloud Storage bucket.
    def _add_argparse_args(cls, parser):
      parser.add_argument("--input", required=True, help='GCS path to the input CSV file.')
      parser.add_argument("--output", required=True, help='GCS path to write the output CSV file to.')
  options = MyOptions()
  with beam.Pipeline(options=options) as pipeline:
    (pipeline
     | 'ReadFromText' >> ReadFromText(options.input)
     | 'EscapeQuotes' >> ParDo(EscapeDoubleQuotes())
     | 'WriteToText' >> WriteToText(options.output)
     )


