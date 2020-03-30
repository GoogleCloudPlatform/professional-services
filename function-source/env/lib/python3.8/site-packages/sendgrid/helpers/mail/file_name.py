class FileName(object):
    """The filename of an Attachment."""

    def __init__(self, file_name=None):
        """Create a FileName object

        :param file_name: The file name of the attachment
        :type file_name: string, optional
        """
        self._file_name = None

        if file_name is not None:
            self.file_name = file_name

    @property
    def file_name(self):
        """The file name of the attachment.

        :rtype: string
        """
        return self._file_name

    @file_name.setter
    def file_name(self, value):
        """The file name of the attachment.

        :param value: The file name of the attachment.
        :type value: string
        """
        self._file_name = value

    def get(self):
        """
        Get a JSON-ready representation of this FileName.

        :returns: This FileName, ready for use in a request body.
        :rtype: string
        """
        return self.file_name
