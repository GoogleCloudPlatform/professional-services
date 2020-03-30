class SpamUrl(object):
    """An Inbound Parse URL that you would like a copy of your email
       along with the spam report to be sent to."""

    def __init__(self, spam_url=None):
        """Create a SpamUrl object

        :param spam_url: An Inbound Parse URL that you would like a copy of
                         your email along with the spam report to be sent to.
        :type spam_url: string, optional
        """
        self._spam_url = None

        if spam_url is not None:
            self.spam_url = spam_url

    @property
    def spam_url(self):
        """An Inbound Parse URL that you would like a copy of your email
           along with the spam report to be sent to.

        :rtype: string
        """
        return self._spam_url

    @spam_url.setter
    def spam_url(self, value):
        """An Inbound Parse URL that you would like a copy of your email
           along with the spam report to be sent to.

        :param value: An Inbound Parse URL that you would like a copy of your
                      email along with the spam report to be sent to.
        :type value: string
        """
        self._spam_url = value

    def get(self):
        """
        Get a JSON-ready representation of this SpamUrl.

        :returns: This SpamUrl, ready for use in a request body.
        :rtype: string
        """
        return self.spam_url
