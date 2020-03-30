class TrackingSettings(object):
    """Settings to track how recipients interact with your email."""

    def __init__(self,
                 click_tracking=None,
                 open_tracking=None,
                 subscription_tracking=None,
                 ganalytics=None):
        """Create a TrackingSettings object

        :param click_tracking: Allows you to track whether a recipient clicked
                               a link in your email.
        :type click_tracking: ClickTracking, optional
        :param open_tracking: Allows you to track whether the email was opened
                              or not, but including a single pixel image in
                              the body of the content. When the pixel is
                              loaded, we can log that the email was opened.
        :type open_tracking: OpenTracking, optional
        :param subscription_tracking: Allows you to insert a subscription
                                      management link at the bottom of the
                                      text and html bodies of your email. If
                                      you would like to specify the location
                                      of the link within your email, you may
                                      use the substitution_tag.
        :type subscription_tracking: SubscriptionTracking, optional
        :param ganalytics: Allows you to enable tracking provided by Google
                           Analytics.
        :type ganalytics: Ganalytics, optional
        """
        self._click_tracking = None
        self._open_tracking = None
        self._subscription_tracking = None
        self._ganalytics = None

        if click_tracking is not None:
            self._click_tracking = click_tracking

        if open_tracking is not None:
            self._open_tracking = open_tracking

        if subscription_tracking is not None:
            self._subscription_tracking = subscription_tracking

        if ganalytics is not None:
            self._ganalytics = ganalytics

    @property
    def click_tracking(self):
        """Allows you to track whether a recipient clicked a link in your email.

        :rtype: ClickTracking
        """
        return self._click_tracking

    @click_tracking.setter
    def click_tracking(self, value):
        """Allows you to track whether a recipient clicked a link in your email.

        :param value: Allows you to track whether a recipient clicked a link
                      in your email.
        :type value: ClickTracking
        """
        self._click_tracking = value

    @property
    def open_tracking(self):
        """Allows you to track whether a recipient opened your email.

        :rtype: OpenTracking
        """
        return self._open_tracking

    @open_tracking.setter
    def open_tracking(self, value):
        """Allows you to track whether a recipient opened your email.

        :param value: Allows you to track whether a recipient opened your
                      email.
        :type value: OpenTracking
        """
        self._open_tracking = value

    @property
    def subscription_tracking(self):
        """Settings for the subscription management link.

        :rtype: SubscriptionTracking
        """
        return self._subscription_tracking

    @subscription_tracking.setter
    def subscription_tracking(self, value):
        """Settings for the subscription management link.

        :param value: Settings for the subscription management link.
        :type value: SubscriptionTracking
        """
        self._subscription_tracking = value

    @property
    def ganalytics(self):
        """Settings for Google Analytics.

        :rtype: Ganalytics
        """
        return self._ganalytics

    @ganalytics.setter
    def ganalytics(self, value):
        """Settings for Google Analytics.

        :param value: Settings for Google Analytics.
        :type value: Ganalytics
        """
        self._ganalytics = value

    def get(self):
        """
        Get a JSON-ready representation of this TrackingSettings.

        :returns: This TrackingSettings, ready for use in a request body.
        :rtype: dict
        """
        tracking_settings = {}
        if self.click_tracking is not None:
            tracking_settings["click_tracking"] = self.click_tracking.get()
        if self.open_tracking is not None:
            tracking_settings["open_tracking"] = self.open_tracking.get()
        if self.subscription_tracking is not None:
            tracking_settings[
                "subscription_tracking"] = self.subscription_tracking.get()
        if self.ganalytics is not None:
            tracking_settings["ganalytics"] = self.ganalytics.get()
        return tracking_settings
