class OpenTrackingSubstitutionTag(object):
    """The open tracking substitution tag of an SubscriptionTracking object."""

    def __init__(self, open_tracking_substitution_tag=None):
        """Create a OpenTrackingSubstitutionTag object

        :param open_tracking_substitution_tag: Allows you to specify a
            substitution tag that you can insert in the body of your
            email at a location that you desire. This tag will be replaced
            by the open tracking pixel.
        """
        self._open_tracking_substitution_tag = None

        if open_tracking_substitution_tag is not None:
            self.open_tracking_substitution_tag = \
                open_tracking_substitution_tag

    @property
    def open_tracking_substitution_tag(self):
        """Allows you to specify a substitution tag that you can insert in
           the body of your email at a location that you desire. This tag
           will be replaced by the open tracking pixel.

        :rtype: string
        """
        return self._open_tracking_substitution_tag

    @open_tracking_substitution_tag.setter
    def open_tracking_substitution_tag(self, value):
        """Allows you to specify a substitution tag that you can insert in
        the body of your email at a location that you desire. This tag will
        be replaced by the open tracking pixel.

        :param value: Allows you to specify a substitution tag that you can
        insert in the body of your email at a location that you desire. This
        tag will be replaced by the open tracking pixel.
        :type value: string
        """
        self._open_tracking_substitution_tag = value

    def get(self):
        """
        Get a JSON-ready representation of this OpenTrackingSubstitutionTag.

        :returns: This OpenTrackingSubstitutionTag, ready for use in a request
                  body.
        :rtype: string
        """
        return self.open_tracking_substitution_tag
