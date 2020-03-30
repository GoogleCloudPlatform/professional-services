class IpPoolName(object):
    """The IP Pool that you would like to send this email from."""

    def __init__(self, ip_pool_name=None):
        """Create a IpPoolName object

        :param ip_pool_name: The IP Pool that you would like to send this
                             email from.
        :type ip_pool_name: string, optional
        """
        self._ip_pool_name = None

        if ip_pool_name is not None:
            self.ip_pool_name = ip_pool_name

    @property
    def ip_pool_name(self):
        """The IP Pool that you would like to send this email from.

        :rtype: string
        """
        return self._ip_pool_name

    @ip_pool_name.setter
    def ip_pool_name(self, value):
        """The IP Pool that you would like to send this email from.

        :param value: The IP Pool that you would like to send this email from.
        :type value: string
        """
        self._ip_pool_name = value

    def get(self):
        """
        Get a JSON-ready representation of this IpPoolName.

        :returns: This IpPoolName, ready for use in a request body.
        :rtype: string
        """
        return self.ip_pool_name
