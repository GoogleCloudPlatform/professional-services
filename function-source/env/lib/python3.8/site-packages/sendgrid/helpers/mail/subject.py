class Subject(object):
    """A subject for an email message."""

    def __init__(self, subject, p=None):
        """Create a Subjuct.

        :param subject: The subject for an email
        :type subject: string
        :param name: p is the Personalization object or Personalization object
                     index
        :type name: Personalization, integer, optional
        """
        self._subject = None
        self._personalization = None

        self.subject = subject
        if p is not None:
            self.personalization = p

    @property
    def subject(self):
        """The subject of an email.

        :rtype: string
        """
        return self._subject

    @subject.setter
    def subject(self, value):
        """The subject of an email.

        :param value: The subject of an email.
        :type value: string
        """
        self._subject = value

    @property
    def personalization(self):
        """The Personalization object or Personalization object index

        :rtype: Personalization, integer
        """
        return self._personalization

    @personalization.setter
    def personalization(self, value):
        """The Personalization object or Personalization object index

        :param value: The Personalization object or Personalization object
                      index
        :type value: Personalization, integer
        """
        self._personalization = value

    def __str__(self):
        """Get a JSON representation of this Mail request.

        :rtype: string
        """
        return str(self.get())

    def get(self):
        """
        Get a JSON-ready representation of this Subject.

        :returns: This Subject, ready for use in a request body.
        :rtype: string
        """
        return self.subject
