class DynamicTemplateData(object):
    """To send a dynamic template, specify the template ID with the
       template_id parameter.
    """

    def __init__(self, dynamic_template_data=None, p=0):
        """Data for a transactional template.
        Should be JSON-serializeable structure.

        :param dynamic_template_data: Data for a transactional template.
        :type dynamic_template_data: A JSON-serializeable structure
        :param name: p is the Personalization object or Personalization object
                     index
        :type name:  Personalization, integer, optional
        """
        self._dynamic_template_data = None
        self._personalization = None

        if dynamic_template_data is not None:
            self.dynamic_template_data = dynamic_template_data
        if p is not None:
            self.personalization = p

    @property
    def dynamic_template_data(self):
        """Data for a transactional template.

        :rtype: A JSON-serializeable structure
        """
        return self._dynamic_template_data

    @dynamic_template_data.setter
    def dynamic_template_data(self, value):
        """Data for a transactional template.

        :param value: Data for a transactional template.
        :type value: A JSON-serializeable structure
        """
        self._dynamic_template_data = value

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

        :rtype: A JSON-serializeable structure
        """
        return str(self.get())

    def get(self):
        """
        Get a JSON-ready representation of this DynamicTemplateData object.

        :returns: Data for a transactional template.
        :rtype: A JSON-serializeable structure.
        """
        return self.dynamic_template_data
