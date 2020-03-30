from .content import Content
from .validators import ValidateApiKey


class PlainTextContent(Content):
    """Plain text content to be included in your email.
    """

    def __init__(self, content):
        """Create a PlainTextContent with the specified MIME type and content.

        :param content: The actual text content.
        :type content: string
        """
        self._content = None
        self._validator = ValidateApiKey()

        if content is not None:
            self.content = content

    @property
    def mime_type(self):
        """The MIME type.

        :rtype: string
        """
        return "text/plain"

    @property
    def content(self):
        """The actual text content.

        :rtype: string
        """
        return self._content

    @content.setter
    def content(self, value):
        """The actual text content.

        :param value: The actual text content.
        :type value: string
        """
        self._validator.validate_message_dict(value)
        self._content = value

    def get(self):
        """
        Get a JSON-ready representation of this PlainTextContent.

        :returns: This PlainTextContent, ready for use in a request body.
        :rtype: dict
        """
        content = {}
        if self.mime_type is not None:
            content["type"] = self.mime_type

        if self.content is not None:
            content["value"] = self.content
        return content
