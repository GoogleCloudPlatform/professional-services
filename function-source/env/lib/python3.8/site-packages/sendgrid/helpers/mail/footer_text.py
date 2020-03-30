class FooterText(object):
    """The text in an Footer."""

    def __init__(self, footer_text=None):
        """Create a FooterText object

        :param footer_text: The plain text content of your footer.
        :type footer_text: string, optional
        """
        self._footer_text = None

        if footer_text is not None:
            self.footer_text = footer_text

    @property
    def footer_text(self):
        """The plain text content of your footer.

        :rtype: string
        """
        return self._footer_text

    @footer_text.setter
    def footer_text(self, value):
        """The plain text content of your footer.

        :param value: The plain text content of your footer.
        :type value: string
        """
        self._footer_text = value

    def get(self):
        """
        Get a JSON-ready representation of this FooterText.

        :returns: This FooterText, ready for use in a request body.
        :rtype: string
        """
        return self.footer_text
