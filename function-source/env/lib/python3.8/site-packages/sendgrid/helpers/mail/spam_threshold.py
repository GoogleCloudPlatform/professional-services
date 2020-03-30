class SpamThreshold(object):
    """The threshold used to determine if your content qualifies as spam
       on a scale from 1 to 10, with 10 being most strict, or most likely
       to be considered as spam."""

    def __init__(self, spam_threshold=None):
        """Create a SpamThreshold object

        :param spam_threshold: The threshold used to determine if your content
                               qualifies as spam on a scale from 1 to 10, with
                               10 being most strict, or most likely to be
                               considered as spam.
        :type spam_threshold: integer, optional
        """
        self._spam_threshold = None

        if spam_threshold is not None:
            self.spam_threshold = spam_threshold

    @property
    def spam_threshold(self):
        """The threshold used to determine if your content
           qualifies as spam on a scale from 1 to 10, with
           10 being most strict, or most likely to be
           considered as spam.

        :rtype: integer
        """
        return self._spam_threshold

    @spam_threshold.setter
    def spam_threshold(self, value):
        """The threshold used to determine if your content
           qualifies as spam on a scale from 1 to 10, with
           10 being most strict, or most likely to be
           considered as spam.

        :param value: The threshold used to determine if your content
        qualifies as spam on a scale from 1 to 10, with
        10 being most strict, or most likely to be
        considered as spam.
        :type value: integer
        """
        self._spam_threshold = value

    def get(self):
        """
        Get a JSON-ready representation of this SpamThreshold.

        :returns: This SpamThreshold, ready for use in a request body.
        :rtype: integer
        """
        return self.spam_threshold
