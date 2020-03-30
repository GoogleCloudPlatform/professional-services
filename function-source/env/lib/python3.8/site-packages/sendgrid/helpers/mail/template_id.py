class TemplateId(object):
    """The template ID of an Attachment object."""

    def __init__(self, template_id=None):
        """Create a TemplateId object

        :param template_id: The template id for the message
        :type template_id: string, optional
        """
        self._template_id = None

        if template_id is not None:
            self.template_id = template_id

    @property
    def template_id(self):
        """The template id for the message

        :rtype: string
        """
        return self._template_id

    @template_id.setter
    def template_id(self, value):
        """The template id for the message

        :param value:  The template id for the message
        :type value: string
        """
        self._template_id = value

    def get(self):
        """
        Get a JSON-ready representation of this TemplateId.

        :returns: This TemplateId, ready for use in a request body.
        :rtype: string
        """
        return self.template_id
