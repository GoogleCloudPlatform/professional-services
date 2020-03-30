class BypassListManagement(object):
    """Setting for Bypass List Management

    Allows you to bypass all unsubscribe groups and suppressions to ensure that
    the email is delivered to every single recipient. This should only be used
    in emergencies when it is absolutely necessary that every recipient
    receives your email.
    """

    def __init__(self, enable=None):
        """Create a BypassListManagement.

        :param enable: Whether emails should bypass list management.
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
        Get a JSON-ready representation of this BypassListManagement.

        :returns: This BypassListManagement, ready for use in a request body.
        :rtype: dict
        """
        bypass_list_management = {}
        if self.enable is not None:
            bypass_list_management["enable"] = self.enable
        return bypass_list_management
