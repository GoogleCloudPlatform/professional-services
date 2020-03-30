class FileType(object):
    """The MIME type of the content you are attaching to an Attachment."""

    def __init__(self, file_type=None):
        """Create a FileType object

        :param file_type: The MIME type of the content you are attaching
        :type file_type: string, optional
        """
        self._file_type = None

        if file_type is not None:
            self.file_type = file_type

    @property
    def file_type(self):
        """The MIME type of the content you are attaching.

        :rtype: string
        """
        return self._file_type

    @file_type.setter
    def file_type(self, mime_type):
        """The MIME type of the content you are attaching.

        :param mime_type: The MIME type of the content you are attaching.
        :rtype mime_type: string
        """
        self._file_type = mime_type

    def get(self):
        """
        Get a JSON-ready representation of this FileType.

        :returns: This FileType, ready for use in a request body.
        :rtype: string
        """
        return self.file_type
