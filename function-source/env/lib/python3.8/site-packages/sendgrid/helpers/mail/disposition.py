class Disposition(object):
    """The content-disposition of the Attachment specifying how you would like
    the attachment to be displayed."""

    def __init__(self, disposition=None):
        """Create a Disposition object

        :param disposition: The content-disposition of the attachment,
                            specifying display style.
                            Specifies how you would like the attachment to be
                            displayed.
                            - "inline" results in the attached file being
                              displayed automatically within the message.
                            - "attachment" results in the attached file
                              requiring some action to display (e.g. opening
                              or downloading the file).
                            If unspecified, "attachment" is used. Must be one
                            of the two choices.
        :type disposition: string, optional
        """
        self._disposition = None

        if disposition is not None:
            self.disposition = disposition

    @property
    def disposition(self):
        """The content-disposition of the attachment, specifying display style.
           Specifies how you would like the attachment to be displayed.
           - "inline" results in the attached file being displayed
             automatically within the message.
           - "attachment" results in the attached file requiring some action to
             display (e.g. opening or downloading the file).
           If unspecified, "attachment" is used. Must be one of the two
           choices.

        :rtype: string
        """
        return self._disposition

    @disposition.setter
    def disposition(self, value):
        """The content-disposition of the attachment, specifying display style.
           Specifies how you would like the attachment to be displayed.
           - "inline" results in the attached file being displayed
             automatically within the message.
           - "attachment" results in the attached file requiring some action to
             display (e.g. opening or downloading the file).
           If unspecified, "attachment" is used. Must be one of the two
           choices.

        :param value: The content-disposition of the attachment, specifying
                      display style.
           Specifies how you would like the attachment to be displayed.
           - "inline" results in the attached file being displayed
             automatically within the message.
           - "attachment" results in the attached file requiring some action to
             display (e.g. opening or downloading the file).
           If unspecified, "attachment" is used. Must be one of the two
           choices.
        :type value: string
        """
        self._disposition = value

    def get(self):
        """
        Get a JSON-ready representation of this Disposition.

        :returns: This Disposition, ready for use in a request body.
        :rtype: string
        """
        return self.disposition
