# ============================================================================
# Copyright 2023 Google. This software is provided as-is, without warranty or
# representation for any use or purpose. Your use of it is subject to your
# agreement with Google.
# ============================================================================

"""A module represents the middleware response."""


class ModelResponse:
  """A Model class for middleware response.

  Attributes:
      output_text: represents a plain text response.
      gcs_link: stores  links to manual/specifications.
  """

  output_text: str
  gcs_link: str

  def __init__(self) -> None:
    self.output_text = ""
    self.gcs_link = ""
