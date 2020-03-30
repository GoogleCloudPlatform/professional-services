class Ganalytics(object):
    """Allows you to enable tracking provided by Google Analytics."""

    def __init__(self,
                 enable=None,
                 utm_source=None,
                 utm_medium=None,
                 utm_term=None,
                 utm_content=None,
                 utm_campaign=None):
        """Create a GAnalytics to enable, customize Google Analytics tracking.

        :param enable: If this setting is enabled.
        :type enable: boolean, optional
        :param utm_source: Name of the referrer source.
        :type utm_source: string, optional
        :param utm_medium: Name of the marketing medium (e.g. "Email").
        :type utm_medium: string, optional
        :param utm_term: Used to identify paid keywords.
        :type utm_term: string, optional
        :param utm_content: Used to differentiate your campaign from ads.
        :type utm_content: string, optional
        :param utm_campaign: The name of the campaign.
        :type utm_campaign: string, optional
        """
        self._enable = None
        self._utm_source = None
        self._utm_medium = None
        self._utm_term = None
        self._utm_content = None
        self._utm_campaign = None

        self.__set_field("enable", enable)
        self.__set_field("utm_source", utm_source)
        self.__set_field("utm_medium", utm_medium)
        self.__set_field("utm_term", utm_term)
        self.__set_field("utm_content", utm_content)
        self.__set_field("utm_campaign", utm_campaign)

    def __set_field(self, field, value):
        """ Sets a field to the provided value if value is not None

        :param field: Name of the field
        :type field: string
        :param value: Value to be set, ignored if None
        :type value: Any
        """
        if value is not None:
            setattr(self, field, value)

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
    def utm_source(self):
        """Name of the referrer source.
        e.g. Google, SomeDomain.com, or Marketing Email

        :rtype: string
        """
        return self._utm_source

    @utm_source.setter
    def utm_source(self, value):
        """Name of the referrer source.
        e.g. Google, SomeDomain.com, or Marketing Email

        :param value: Name of the referrer source.
        e.g. Google, SomeDomain.com, or Marketing Email
        :type value: string
        """
        self._utm_source = value

    @property
    def utm_medium(self):
        """Name of the marketing medium (e.g. Email).

        :rtype: string
        """
        return self._utm_medium

    @utm_medium.setter
    def utm_medium(self, value):
        """Name of the marketing medium (e.g. Email).

        :param value: Name of the marketing medium (e.g. Email).
        :type value: string
        """
        self._utm_medium = value

    @property
    def utm_term(self):
        """Used to identify any paid keywords.

        :rtype: string
        """
        return self._utm_term

    @utm_term.setter
    def utm_term(self, value):
        """Used to identify any paid keywords.

        :param value: Used to identify any paid keywords.
        :type value: string
        """
        self._utm_term = value

    @property
    def utm_content(self):
        """Used to differentiate your campaign from advertisements.

        :rtype: string
        """
        return self._utm_content

    @utm_content.setter
    def utm_content(self, value):
        """Used to differentiate your campaign from advertisements.

        :param value: Used to differentiate your campaign from advertisements.
        :type value: string
        """
        self._utm_content = value

    @property
    def utm_campaign(self):
        """The name of the campaign.

        :rtype: string
        """
        return self._utm_campaign

    @utm_campaign.setter
    def utm_campaign(self, value):
        """The name of the campaign.

        :param value: The name of the campaign.
        :type value: string
        """
        self._utm_campaign = value

    def get(self):
        """
        Get a JSON-ready representation of this Ganalytics.

        :returns: This Ganalytics, ready for use in a request body.
        :rtype: dict
        """
        keys = ["enable", "utm_source", "utm_medium", "utm_term",
                "utm_content", "utm_campaign"]

        ganalytics = {}

        for key in keys:
            value = getattr(self, key, None)
            if value is not None:
                if isinstance(value, bool) or isinstance(value, str):
                    ganalytics[key] = value
                else:
                    ganalytics[key] = value.get()

        return ganalytics
