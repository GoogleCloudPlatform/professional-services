# ============================================================================
# Copyright 2023 Google. This software is provided as-is, without warranty or
# representation for any use or purpose. Your use of it is subject to your
# agreement with Google.
# ============================================================================

"""A module represents the session state."""


import uuid


class SessionInfo:
  """A class to represent user's session state.

  Attributes:
      id: a unique id of the user's session.
  """

  def __init__(self) -> None:
    self.id = str(uuid.uuid4())
