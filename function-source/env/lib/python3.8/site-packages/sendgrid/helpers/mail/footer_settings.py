class FooterSettings(object):
    """The default footer that you would like included on every email."""

    def __init__(self, enable=None, text=None, html=None):
        """Create a default footer.

        :param enable: Whether this footer should be applied.
        :type enable: boolean, optional
        :param text: Text content of this footer
        :type text: FooterText, optional
        :param html: HTML content of this footer
        :type html: FooterHtml, optional
        """
        self._enable = None
        self._text = None
        self._html = None

        if enable is not None:
            self.enable = enable

        if text is not None:
            self.text = text

        if html is not None:
            self.html = html

    @property
    def enable(self):
        """Indicates if this setting is enabled.

        :rtype: boolean
        """
        return self._enable

    @enable.setter
    def enable(self, value):
        """Indicates if this setting is enabled.

        :param value: Indicates if this setting is enabled.
        :type value: boolean
        """
        self._enable = value

    @property
    def text(self):
        """The plain text content of your footer.

        :rtype: string
        """
        return self._text

    @text.setter
    def text(self, value):
        """The plain text content of your footer.

        :param value: The plain text content of your footer.
        :type value: string
        """
        self._text = value

    @property
    def html(self):
        """The HTML content of your footer.

        :rtype: string
        """
        return self._html

    @html.setter
    def html(self, value):
        """The HTML content of your footer.

        :param value: The HTML content of your footer.
        :type value: string
        """
        self._html = value

    def get(self):
        """
        Get a JSON-ready representation of this FooterSettings.

        :returns: This FooterSettings, ready for use in a request body.
        :rtype: dict
        """
        footer_settings = {}
        if self.enable is not None:
            footer_settings["enable"] = self.enable

        if self.text is not None:
            footer_settings["text"] = self.text.get()

        if self.html is not None:
            footer_settings["html"] = self.html.get()
        return footer_settings
