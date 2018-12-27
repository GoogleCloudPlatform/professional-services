"""Defines Abstract class for connecting to a database"""

from abc import ABCMeta, abstractmethod


class DatabaseComponent:
    """Initializes the database connection parameters.

    Implement get_connection abstract method to establish a connection and
    get_cusror method to create a cursor object
    """

    __metaclass__ = ABCMeta

    def __init__(self, host, port, user, password=None,
                 database=None):
        self.host = host
        self.user = user
        self.password = password
        self.database = database
        self.port = port
        self.connection = self.get_connection()

    @abstractmethod
    def get_connection(self):
        """Establish connection to the database"""
        pass

    @abstractmethod
    def get_cursor(self):
        """Create a cursor object"""
        pass
