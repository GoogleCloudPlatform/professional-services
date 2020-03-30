class SubscriptionSubstitutionTag(object):
    """The subscription substitution tag of an SubscriptionTracking."""

    def __init__(self, subscription_substitution_tag=None):
        """Create a SubscriptionSubstitutionTag object

        :param subscription_substitution_tag: A tag that will be replaced with
                                              the unsubscribe URL. for example:
                                              [unsubscribe_url]. If this
                                              parameter is used, it will
                                              override both the text and html
                                              parameters. The URL of the link
                                              will be placed at the
                                              substitution tag's location,
                                              with no additional formatting.
        :type subscription_substitution_tag: string, optional
        """
        self._subscription_substitution_tag = None

        if subscription_substitution_tag is not None:
            self.subscription_substitution_tag = subscription_substitution_tag

    @property
    def subscription_substitution_tag(self):
        """A tag that will be replaced with the unsubscribe URL. for example:
           [unsubscribe_url]. If this parameter is used, it will override both
           the text and html parameters. The URL of the link will be placed at
           the substitution tag's location, with no additional formatting.

        :rtype: string
        """
        return self._subscription_substitution_tag

    @subscription_substitution_tag.setter
    def subscription_substitution_tag(self, value):
        """A tag that will be replaced with the unsubscribe URL. for example:
           [unsubscribe_url]. If this parameter is used, it will override both
           the text and html parameters. The URL of the link will be placed at
           the substitution tag's location, with no additional formatting.

        :param value: A tag that will be replaced with the unsubscribe URL.
                      for example: [unsubscribe_url]. If this parameter is
                      used, it will override both the text and html parameters.
                      The URL of the link will be placed at the substitution
                      tag's location, with no additional formatting.
        :type value: string
        """
        self._subscription_substitution_tag = value

    def get(self):
        """
        Get a JSON-ready representation of this SubscriptionSubstitutionTag.

        :returns: This SubscriptionSubstitutionTag, ready for use in a request
                  body.
        :rtype: string
        """
        return self.subscription_substitution_tag
