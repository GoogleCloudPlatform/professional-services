class BatchId(object):
    """This ID represents a batch of emails to be sent at the same time.
       Including a batch_id in your request allows you include this email
       in that batch, and also enables you to cancel or pause the delivery
       of that batch. For more information, see
       https://sendgrid.com/docs/API_Reference/Web_API_v3/cancel_schedule_send.
    """
    def __init__(self, batch_id=None):
        """Create a batch ID.

        :param batch_id: Batch Id
        :type batch_id: string
        """
        self._batch_id = None

        if batch_id is not None:
            self.batch_id = batch_id

    @property
    def batch_id(self):
        """A unix timestamp.

        :rtype: string
        """
        return self._batch_id

    @batch_id.setter
    def batch_id(self, value):
        """A unix timestamp.

        :param value: Batch Id
        :type value: string
        """
        self._batch_id = value

    def __str__(self):
        """Get a JSON representation of this object.

        :rtype: string
        """
        return str(self.get())

    def get(self):
        """
        Get a JSON-ready representation of this SendAt object.

        :returns: The BatchId, ready for use in a request body.
        :rtype: string
        """
        return self.batch_id
