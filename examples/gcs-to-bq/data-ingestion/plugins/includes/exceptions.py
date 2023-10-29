# Copyright 2023 Google LLC. This software is provided as-is, without warranty
# or representation for any use or purpose. Your use of it is subject to your
# agreement with Google.

class MissingConfigurationException(Exception):
    """Exception raised when there are missing required fields in the configuration
    
    Attributes:
        name -- name of the configuration item
        field -- missing field
        message -- explanation of the exception
    """
    
    def __init__(self, name, field, message="Missing required field in the configuration."):
        self.name = name
        self.field = field
        self.message = message
        super().__init__(self.message)

    def __str__(self):
        return f"Config Name: {self.name}, Field: {self.field} -> {self.message}"
        