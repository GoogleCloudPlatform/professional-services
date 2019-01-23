"""Defines custom exceptions"""


class ConnectionError(Exception):
    """Raised when there is a connection failure to any of the Hive, BigQuery,
    GCS, and MySQL components"""
    pass


class MySQLExecutionError(Exception):
    """Raised when there is a failure in executing query on MySQL database"""
    pass


class HiveExecutionError(Exception):
    """Raised when there is a failure in executing query on MySQL database"""
    pass


class IncrementalColumnError(Exception):
    """Raised when the provided incremental column is not valid"""
    pass


class HDFSCommandError(Exception):
    """Raised when HDFS command execution fails"""
    pass
