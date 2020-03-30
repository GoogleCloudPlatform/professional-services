class ClickTracking(object):
    """Allows you to track whether a recipient clicked a link in your email."""

    def __init__(self, enable=None, enable_text=None):
        """Create a ClickTracking to track clicked links in your email.

        :param enable: Whether click tracking is enabled
        :type enable: boolean, optional
        :param enable_text: If click tracking is on in your email's text/plain.
        :type enable_text: boolean, optional
        """
        self._enable = None
        self._enable_text = None

        if enable is not None:
            self.enable = enable

        if enable_text is not None:
            self.enable_text = enable_text

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
    def enable_text(self):
        """Indicates if this setting should be included in the text/plain
        portion of your email.

        :rtype: boolean
        """
        return self._enable_text

    @enable_text.setter
    def enable_text(self, value):
        """Indicates if this setting should be included in the text/plain
        portion of your email.

        :param value: Indicates if this setting should be included in the
        text/plain portion of your email.
        :type value: boolean
        """
        self._enable_text = value

    def get(self):
        """
        Get a JSON-ready representation of this ClickTracking.

        :returns: This ClickTracking, ready for use in a request body.
        :rtype: dict
        """
        click_tracking = {}
        if self.enable is not None:
            click_tracking["enable"] = self.enable

        if self.enable_text is not None:
            click_tracking["enable_text"] = self.enable_text
        return click_tracking
