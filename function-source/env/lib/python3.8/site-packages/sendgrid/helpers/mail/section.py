class Section(object):
    """A block section of code to be used as a substitution."""

    def __init__(self, key=None, value=None):
        """Create a section with the given key and value.

        :param key: section of code key
        :type key: string
        :param value: section of code value
        :type value: string
        """
        self._key = None
        self._value = None

        if key is not None:
            self.key = key
        if value is not None:
            self.value = value

    @property
    def key(self):
        """A section of code's key.

        :rtype key: string
        """
        return self._key

    @key.setter
    def key(self, value):
        """A section of code's key.

        :param key: section of code key
        :type key: string
        """
        self._key = value

    @property
    def value(self):
        """A section of code's value.

        :rtype: string
        """
        return self._value

    @value.setter
    def value(self, value):
        """A section of code's value.

        :param value: A section of code's value.
        :type value: string
        """
        self._value = value

    def get(self):
        """
        Get a JSON-ready representation of this Section.

        :returns: This Section, ready for use in a request body.
        :rtype: dict
        """
        section = {}
        if self.key is not None and self.value is not None:
            section[self.key] = self.value
        return section
