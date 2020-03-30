class SendAt(object):
    """A unix timestamp allowing you to specify when you want your
    email to be delivered. This may be overridden by the
    personalizations[x].send_at parameter. You can't schedule more
    than 72 hours in advance. If you have the flexibility, it's
    better to schedule mail for off-peak times. Most emails are
    scheduled and sent at the top of the hour or half hour.
    Scheduling email to avoid those times (for example, scheduling
    at 10:53) can result in lower deferral rates because it won't
    be going through our servers at the same times as everyone else's
    mail."""
    def __init__(self, send_at=None, p=None):
        """Create a unix timestamp specifying when your email should
        be delivered.

        :param send_at: Unix timestamp
        :type send_at: integer
        :param name: p is the Personalization object or Personalization object
                     index
        :type name: Personalization, integer, optional
        """
        self._send_at = None
        self._personalization = None

        if send_at is not None:
            self.send_at = send_at
        if p is not None:
            self.personalization = p

    @property
    def send_at(self):
        """A unix timestamp.

        :rtype: integer
        """
        return self._send_at

    @send_at.setter
    def send_at(self, value):
        """A unix timestamp.

        :param value: A unix timestamp.
        :type value: integer
        """
        self._send_at = value

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
        """Get a JSON representation of this object.

        :rtype: integer
        """
        return str(self.get())

    def get(self):
        """
        Get a JSON-ready representation of this SendAt object.

        :returns: The unix timestamp, ready for use in a request body.
        :rtype: integer
        """
        return self.send_at
