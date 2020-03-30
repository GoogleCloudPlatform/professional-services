class SandBoxMode(object):
    """Setting for sandbox mode.
    This allows you to send a test email to ensure that your request body is
    valid and formatted correctly.
    """
    def __init__(self, enable=None):
        """Create an enabled or disabled SandBoxMode.

        :param enable: Whether this is a test request.
        :type enable: boolean, optional
        """
        self._enable = None

        if enable is not None:
            self.enable = enable

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

    def get(self):
        """
        Get a JSON-ready representation of this SandBoxMode.

        :returns: This SandBoxMode, ready for use in a request body.
        :rtype: dict
        """
        sandbox_mode = {}
        if self.enable is not None:
            sandbox_mode["enable"] = self.enable
        return sandbox_mode
