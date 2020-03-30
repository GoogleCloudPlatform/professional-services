class UtmCampaign(object):
    """The utm campaign of an Ganalytics object."""

    def __init__(self, utm_campaign=None):
        """Create a UtmCampaign object

        :param utm_campaign: The name of the campaign

        :type utm_campaign: string, optional
        """
        self._utm_campaign = None

        if utm_campaign is not None:
            self.utm_campaign = utm_campaign

    @property
    def utm_campaign(self):
        """The name of the campaign

        :rtype: string
        """
        return self._utm_campaign

    @utm_campaign.setter
    def utm_campaign(self, value):
        """The name of the campaign

        :param value: The name of the campaign
        :type value: string
        """
        self._utm_campaign = value

    def get(self):
        """
        Get a JSON-ready representation of this UtmCampaign.

        :returns: This UtmCampaign, ready for use in a request body.
        :rtype: string
        """
        return self.utm_campaign
