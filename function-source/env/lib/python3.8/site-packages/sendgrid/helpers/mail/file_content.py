class FileContent(object):
    """The Base64 encoded content of an Attachment."""

    def __init__(self, file_content=None):
        """Create a FileContent object

        :param file_content: The Base64 encoded content of the attachment
        :type file_content: string, optional
        """
        self._file_content = None

        if file_content is not None:
            self.file_content = file_content

    @property
    def file_content(self):
        """The Base64 encoded content of the attachment.

        :rtype: string
        """
        return self._file_content

    @file_content.setter
    def file_content(self, value):
        """The Base64 encoded content of the attachment.

        :param value: The Base64 encoded content of the attachment.
        :type value: string
        """
        self._file_content = value

    def get(self):
        """
        Get a JSON-ready representation of this FileContente.

        :returns: This FileContent, ready for use in a request body.
        :rtype: string
        """
        return self.file_content
