class OpenTracking(object):
    """
    Allows you to track whether the email was opened or not, by including a
    single pixel image in the body of the content. When the pixel is loaded,
    we log that the email was opened.
    """

    def __init__(self, enable=None, substitution_tag=None):
        """Create an OpenTracking to track when your email is opened.

        :param enable: If open tracking is enabled.
        :type enable: boolean, optional
        :param substitution_tag: Tag in body to be replaced by tracking pixel.
        :type substitution_tag: OpenTrackingSubstitionTag, optional
        """
        self._enable = None
        self._substitution_tag = None

        if enable is not None:
            self.enable = enable

        if substitution_tag is not None:
            self.substitution_tag = substitution_tag

    @property
    def enable(self):
        """Indicates if this setting is enabled.

        :rtype: boolean
        """
        return self._enable

    @enable.setter
    def enable(self, value):
        """Indicates if this setting is enabled.

        :param value: Indicates if this setting is enabled.
        :type value: boolean
        """
        self._enable = value

    @property
    def substitution_tag(self):
        """Allows you to specify a substitution tag that you can insert in the
        body of your email at a location that you desire. This tag will be
        replaced by the open tracking pixel.

        :rtype: string
        """
        return self._substitution_tag

    @substitution_tag.setter
    def substitution_tag(self, value):
        """Allows you to specify a substitution tag that you can insert in the
        body of your email at a location that you desire. This tag will be
        replaced by the open tracking pixel.

        :param value: Allows you to specify a substitution tag that you can
                      insert in the body of your email at a location that you
                      desire. This tag will be replaced by the open tracking
                      pixel.

        :type value: string
        """
        self._substitution_tag = value

    def get(self):
        """
        Get a JSON-ready representation of this OpenTracking.

        :returns: This OpenTracking, ready for use in a request body.
        :rtype: dict
        """
        open_tracking = {}
        if self.enable is not None:
            open_tracking["enable"] = self.enable

        if self.substitution_tag is not None:
            open_tracking["substitution_tag"] = self.substitution_tag.get()
        return open_tracking
