class SubscriptionText(object):
    """The text of an SubscriptionTracking."""

    def __init__(self, subscription_text=None):
        """Create a SubscriptionText object

        :param subscription_text: Text to be appended to the email, with the
                                  subscription tracking link. You may control
                                  where the link is by using the tag <% %>
        :type subscription_text: string, optional
        """
        self._subscription_text = None

        if subscription_text is not None:
            self.subscription_text = subscription_text

    @property
    def subscription_text(self):
        """Text to be appended to the email, with the subscription tracking link.
           You may control where the link is by using the tag <% %>

        :rtype: string
        """
        return self._subscription_text

    @subscription_text.setter
    def subscription_text(self, value):
        """Text to be appended to the email, with the subscription tracking link.
           You may control where the link is by using the tag <% %>

        :param value: Text to be appended to the email, with the subscription
                      tracking link. You may control where the link is by using
                      the tag <% %>
        :type value: string
        """
        self._subscription_text = value

    def get(self):
        """
        Get a JSON-ready representation of this SubscriptionText.

        :returns: This SubscriptionText, ready for use in a request body.
        :rtype: string
        """
        return self.subscription_text
