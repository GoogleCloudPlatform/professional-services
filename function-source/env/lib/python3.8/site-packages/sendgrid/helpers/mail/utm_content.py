class UtmContent(object):
    """The utm content of an Ganalytics object."""

    def __init__(self, utm_content=None):
        """Create a UtmContent object

        :param utm_content: Used to differentiate your campaign from advertisements.

        :type utm_content: string, optional
        """
        self._utm_content = None

        if utm_content is not None:
            self.utm_content = utm_content

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

    def get(self):
        """
        Get a JSON-ready representation of this UtmContent.

        :returns: This UtmContent, ready for use in a request body.
        :rtype: string
        """
        return self.utm_content
