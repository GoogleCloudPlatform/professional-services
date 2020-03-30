class SubscriptionHtml(object):
    """The HTML of an SubscriptionTracking."""

    def __init__(self, subscription_html=None):
        """Create a SubscriptionHtml object

        :param subscription_html: Html to be appended to the email, with the
                                  subscription tracking link. You may control
                                  where the link is by using the tag <% %>
        :type subscription_html: string, optional
        """
        self._subscription_html = None

        if subscription_html is not None:
            self.subscription_html = subscription_html

    @property
    def subscription_html(self):
        """Html to be appended to the email, with the subscription tracking link.
           You may control where the link is by using the tag <% %>

        :rtype: string
        """
        return self._subscription_html

    @subscription_html.setter
    def subscription_html(self, value):
        """Html to be appended to the email, with the subscription tracking link.
           You may control where the link is by using the tag <% %>

        :param value: Html to be appended to the email, with the subscription
                      tracking link. You may control where the link is by using
                      the tag <% %>
        :type value: string
        """
        self._subscription_html = value

    def get(self):
        """
        Get a JSON-ready representation of this SubscriptionHtml.

        :returns: This SubscriptionHtml, ready for use in a request body.
        :rtype: string
        """
        return self.subscription_html
