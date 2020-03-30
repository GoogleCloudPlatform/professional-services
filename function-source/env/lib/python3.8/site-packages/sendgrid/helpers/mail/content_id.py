class ContentId(object):
    """The ContentId of an Attachment."""

    def __init__(self, content_id=None):
        """Create a ContentId object

        :param content_id: The content id for the attachment.
                           This is used when the Disposition is set to "inline"
                           and the attachment is an image, allowing the file to
                           be displayed within the email body.
        :type content_id: string, optional
        """
        self._content_id = None

        if content_id is not None:
            self.content_id = content_id

    @property
    def content_id(self):
        """The content id for the attachment.
           This is used when the Disposition is set to "inline" and the
           attachment is an image, allowing the file to be displayed within
           the email body.

        :rtype: string
        """
        return self._content_id

    @content_id.setter
    def content_id(self, value):
        """The content id for the attachment.
           This is used when the Disposition is set to "inline" and the
           attachment is an image, allowing the file to be displayed within
           the email body.

        :param value: The content id for the attachment.
        This is used when the Disposition is set to "inline" and the attachment
        is an image, allowing the file to be displayed within the email body.
        :type value: string
        """
        self._content_id = value

    def get(self):
        """
        Get a JSON-ready representation of this ContentId.

        :returns: This ContentId, ready for use in a request body.
        :rtype: string
        """
        return self.content_id
