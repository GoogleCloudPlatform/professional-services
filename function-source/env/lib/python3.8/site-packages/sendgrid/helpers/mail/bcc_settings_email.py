class BccSettingsEmail(object):
    """The BccSettingsEmail of an Attachment."""

    def __init__(self, bcc_settings_email=None):
        """Create a BccSettingsEmail object

        :param bcc_settings_email: The email address that you would like to
                                   receive the BCC
        :type bcc_settings_email: string, optional
        """
        self._bcc_settings_email = None

        if bcc_settings_email is not None:
            self.bcc_settings_email = bcc_settings_email

    @property
    def bcc_settings_email(self):
        """The email address that you would like to receive the BCC

        :rtype: string
        """
        return self._bcc_settings_email

    @bcc_settings_email.setter
    def bcc_settings_email(self, value):
        """The email address that you would like to receive the BCC

        :param value: The email address that you would like to receive the BCC
        :type value: string
        """
        self._bcc_settings_email = value

    def get(self):
        """
        Get a JSON-ready representation of this BccSettingsEmail.

        :returns: This BccSettingsEmail, ready for use in a request body.
        :rtype: string
        """
        return self.bcc_settings_email
