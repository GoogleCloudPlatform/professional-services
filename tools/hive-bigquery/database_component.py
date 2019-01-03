"""Defines Abstract class for connecting to a database"""

from abc import ABCMeta, abstractmethod


class DatabaseComponent:
    """Initializes the database connection parameters.

    Implement get_connection abstract method to establish a connection and
    get_cursor method to create a cursor object
    """

    __metaclass__ = ABCMeta

    def __init__(self, **kwargs):
        self.host = kwargs['host']
        self.port = kwargs['port']
        self.user = kwargs['user']
        self.password = kwargs['password']
        self.database = kwargs['database']

        self.connection = self.get_connection()

    @abstractmethod
    def get_connection(self):
        """Establish connection to the database"""
        pass

    @abstractmethod
    def get_cursor(self):
        """Create a cursor object"""
        pass
