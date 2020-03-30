class UtmMedium(object):
    """The utm medium of an Ganalytics object."""

    def __init__(self, utm_medium=None):
        """Create a UtmMedium object

        :param utm_medium: Name of the marketing medium. (e.g. Email)

        :type utm_medium: string, optional
        """
        self._utm_medium = None

        if utm_medium is not None:
            self.utm_medium = utm_medium

    @property
    def utm_medium(self):
        """Name of the marketing medium. (e.g. Email)

        :rtype: string
        """
        return self._utm_medium

    @utm_medium.setter
    def utm_medium(self, value):
        """Name of the marketing medium. (e.g. Email)

        :param value: Name of the marketing medium. (e.g. Email)
        :type value: string
        """
        self._utm_medium = value

    def get(self):
        """
        Get a JSON-ready representation of this UtmMedium.

        :returns: This UtmMedium, ready for use in a request body.
        :rtype: string
        """
        return self.utm_medium
