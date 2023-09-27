'''
GreyImageException is an exception class which is used to throw the exception of returning a grey image
'''


class ConnectorException(Exception):
    def __init__(self, message):
        # Call the base class constructor with the parameters it needs
        super().__init__(message)
