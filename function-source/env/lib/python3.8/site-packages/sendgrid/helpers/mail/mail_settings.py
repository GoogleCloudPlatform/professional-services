class MailSettings(object):
    """A collection of mail settings that specify how to handle this email."""

    def __init__(self,
                 bcc_settings=None,
                 bypass_list_management=None,
                 footer_settings=None,
                 sandbox_mode=None,
                 spam_check=None):
        """Create a MailSettings object

        :param bcc_settings: The BCC Settings of this MailSettings
        :type bcc_settings: BCCSettings, optional
        :param bypass_list_management: Whether this MailSettings bypasses list
                                       management
        :type bypass_list_management: BypassListManagement, optional
        :param footer_settings: The default footer specified by this
                                MailSettings
        :type footer_settings: FooterSettings, optional
        :param sandbox_mode: Whether this MailSettings enables sandbox mode
        :type sandbox_mode: SandBoxMode, optional
        :param spam_check: How this MailSettings requests email to be checked
                           for spam
        :type spam_check: SpamCheck, optional
        """
        self._bcc_settings = None
        self._bypass_list_management = None
        self._footer_settings = None
        self._sandbox_mode = None
        self._spam_check = None

        if bcc_settings is not None:
            self.bcc_settings = bcc_settings

        if bypass_list_management is not None:
            self.bypass_list_management = bypass_list_management

        if footer_settings is not None:
            self.footer_settings = footer_settings

        if sandbox_mode is not None:
            self.sandbox_mode = sandbox_mode

        if spam_check is not None:
            self.spam_check = spam_check

    @property
    def bcc_settings(self):
        """The BCC Settings of this MailSettings.

        :rtype: BCCSettings
        """
        return self._bcc_settings

    @bcc_settings.setter
    def bcc_settings(self, value):
        """The BCC Settings of this MailSettings.

        :param value: The BCC Settings of this MailSettings.
        :type value: BCCSettings
        """
        self._bcc_settings = value

    @property
    def bypass_list_management(self):
        """Whether this MailSettings bypasses list management.

        :rtype: BypassListManagement
        """
        return self._bypass_list_management

    @bypass_list_management.setter
    def bypass_list_management(self, value):
        """Whether this MailSettings bypasses list management.

        :param value: Whether this MailSettings bypasses list management.
        :type value: BypassListManagement
        """
        self._bypass_list_management = value

    @property
    def footer_settings(self):
        """The default footer specified by this MailSettings.

        :rtype: FooterSettings
        """
        return self._footer_settings

    @footer_settings.setter
    def footer_settings(self, value):
        """The default footer specified by this MailSettings.

        :param value: The default footer specified by this MailSettings.
        :type value: FooterSettings
        """
        self._footer_settings = value

    @property
    def sandbox_mode(self):
        """Whether this MailSettings enables sandbox mode.

        :rtype: SandBoxMode
        """
        return self._sandbox_mode

    @sandbox_mode.setter
    def sandbox_mode(self, value):
        """Whether this MailSettings enables sandbox mode.

        :param value: Whether this MailSettings enables sandbox mode.
        :type value: SandBoxMode
        """
        self._sandbox_mode = value

    @property
    def spam_check(self):
        """How this MailSettings requests email to be checked for spam.

        :rtype: SpamCheck
        """
        return self._spam_check

    @spam_check.setter
    def spam_check(self, value):
        """How this MailSettings requests email to be checked for spam.

        :param value: How this MailSettings requests email to be checked
                      for spam.
        :type value: SpamCheck
        """
        self._spam_check = value

    def get(self):
        """
        Get a JSON-ready representation of this MailSettings.

        :returns: This MailSettings, ready for use in a request body.
        :rtype: dict
        """
        mail_settings = {}
        if self.bcc_settings is not None:
            mail_settings["bcc"] = self.bcc_settings.get()

        if self.bypass_list_management is not None:
            mail_settings[
                "bypass_list_management"] = self.bypass_list_management.get()

        if self.footer_settings is not None:
            mail_settings["footer"] = self.footer_settings.get()

        if self.sandbox_mode is not None:
            mail_settings["sandbox_mode"] = self.sandbox_mode.get()

        if self.spam_check is not None:
            mail_settings["spam_check"] = self.spam_check.get()
        return mail_settings
