"""Defines Abstract class for connecting to a GCP service"""

from abc import ABCMeta, abstractmethod


class GCPService:
    """Create a client to connect to the service"""
    __metaclass__ = ABCMeta

    def __init__(self, project_id):
        self.project_id = project_id
        self.client = self.get_client()

    @abstractmethod
    def get_client(self):
        """Create client object"""
        pass
