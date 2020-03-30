class UtmSource(object):
    """The utm source of an Ganalytics object."""

    def __init__(self, utm_source=None):
        """Create a UtmSource object

        :param utm_source: Name of the referrer source.
            (e.g. Google, SomeDomain.com, or Marketing Email)
        :type utm_source: string, optional
        """
        self._utm_source = None

        if utm_source is not None:
            self.utm_source = utm_source

    @property
    def utm_source(self):
        """Name of the referrer source. (e.g. Google, SomeDomain.com, or
           Marketing Email)

        :rtype: string
        """
        return self._utm_source

    @utm_source.setter
    def utm_source(self, value):
        """Name of the referrer source. (e.g. Google, SomeDomain.com, or
           Marketing Email)

        :param value: Name of the referrer source.
        (e.g. Google, SomeDomain.com, or Marketing Email)
        :type value: string
        """
        self._utm_source = value

    def get(self):
        """
        Get a JSON-ready representation of this UtmSource.

        :returns: This UtmSource, ready for use in a request body.
        :rtype: string
        """
        return self.utm_source
