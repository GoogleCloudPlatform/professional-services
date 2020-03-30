from .content import Content
from .validators import ValidateApiKey


class HtmlContent(Content):
    """HTML content to be included in your email."""

    def __init__(self, content):
        """Create an HtmlContent with the specified MIME type and content.

        :param content: The HTML content.
        :type content: string
        """
        self._content = None
        self._validator = ValidateApiKey()

        if content is not None:
            self.content = content

    @property
    def mime_type(self):
        """The MIME type for HTML content.

        :rtype: string
        """
        return "text/html"

    @property
    def content(self):
        """The actual HTML content.

        :rtype: string
        """
        return self._content

    @content.setter
    def content(self, value):
        """The actual HTML content.

        :param value: The actual HTML content.
        :type value: string
        """
        self._validator.validate_message_dict(value)
        self._content = value

    def get(self):
        """
        Get a JSON-ready representation of this HtmlContent.

        :returns: This HtmlContent, ready for use in a request body.
        :rtype: dict
        """
        content = {}
        if self.mime_type is not None:
            content["type"] = self.mime_type

        if self.content is not None:
            content["value"] = self.content
        return content
