class Substitution(object):
    """A string substitution to be applied to the text and HTML contents of
    the body of your email, as well as in the Subject and Reply-To parameters.
    """

    def __init__(self, key=None, value=None, p=None):
        """Create a Substitution with the given key and value.

        :param key: Text to be replaced with "value" param
        :type key: string, optional
        :param value: Value to substitute into email
        :type value: string, optional
        :param name: p is the Personalization object or Personalization object
                     index
        :type name: Personalization, integer, optional
        """
        self._key = None
        self._value = None
        self._personalization = None

        if key is not None:
            self.key = key
        if value is not None:
            self.value = value
        if p is not None:
            self.personalization = p

    @property
    def key(self):
        """The substitution key.

        :rtype key: string
        """
        return self._key

    @key.setter
    def key(self, value):
        """The substitution key.

        :param key: The substitution key.
        :type key: string
        """
        self._key = value

    @property
    def value(self):
        """The substitution value.

        :rtype value: string
        """
        return str(self._value) if isinstance(self._value, int) else self._value

    @value.setter
    def value(self, value):
        """The substitution value.

        :param value: The substitution value.
        :type value: string
        """
        self._value = value

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

    def get(self):
        """
        Get a JSON-ready representation of this Substitution.

        :returns: This Substitution, ready for use in a request body.
        :rtype: dict
        """
        substitution = {}
        if self.key is not None and self.value is not None:
            substitution[self.key] = self.value
        return substitution
