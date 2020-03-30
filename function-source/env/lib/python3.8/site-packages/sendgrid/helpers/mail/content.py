from .validators import ValidateApiKey



class Content(object):
    """Content to be included in your email.

    You must specify at least one mime type in the Contents of your email.
    """

    def __init__(self, mime_type, content):
        """Create a Content with the specified MIME type and content.

        :param mime_type: MIME type of this Content (e.g. "text/plain").
        :type mime_type: string
        :param content: The actual content.
        :type content: string
        """
        self._mime_type = None
        self._content = None
        self._validator = ValidateApiKey()

        if mime_type is not None:
            self.mime_type = mime_type

        if content is not None:
            self.content = content

    @property
    def mime_type(self):
        """The MIME type of the content you are including in your email.
        For example, "text/plain" or "text/html".

        :rtype: string
        """
        return self._mime_type

    @mime_type.setter
    def mime_type(self, value):
        """The MIME type of the content you are including in your email.
        For example, "text/plain" or "text/html".

        :param value: The MIME type of the content you are including in your
                      email.
        For example, "text/plain" or "text/html".
        :type value: string
        """
        self._mime_type = value

    @property
    def content(self):
        """The actual content (of the specified mime type).

        :rtype: string
        """
        return self._content

    @content.setter
    def content(self, value):
        """The actual content (of the specified mime type).

        :param value: The actual content (of the specified mime type).
        :type value: string
        """
        self._validator.validate_message_dict(value)
        self._content = value

    def get(self):
        """
        Get a JSON-ready representation of this Content.

        :returns: This Content, ready for use in a request body.
        :rtype: dict
        """
        content = {}
        if self.mime_type is not None:
            content["type"] = self.mime_type

        if self.content is not None:
            content["value"] = self.content
        return content
