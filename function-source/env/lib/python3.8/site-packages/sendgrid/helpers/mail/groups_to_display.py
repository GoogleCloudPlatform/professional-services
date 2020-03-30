class GroupsToDisplay(object):
    """The unsubscribe groups that you would like to be displayed on the
    unsubscribe preferences page.."""

    def __init__(self, groups_to_display=None):
        """Create a GroupsToDisplay object

        :param groups_to_display: An array containing the unsubscribe groups
                                  that you would like to be displayed on the
                                  unsubscribe preferences page.
        :type groups_to_display: array of integers, optional
        """
        self._groups_to_display = None

        if groups_to_display is not None:
            self.groups_to_display = groups_to_display

    @property
    def groups_to_display(self):
        """An array containing the unsubscribe groups that you would like to be
        displayed on the unsubscribe preferences page.

        :rtype: array(int)
        """
        return self._groups_to_display

    @groups_to_display.setter
    def groups_to_display(self, value):
        """An array containing the unsubscribe groups that you would like to be
        displayed on the unsubscribe preferences page.

        :param value: An array containing the unsubscribe groups that you
                      would like to be displayed on the unsubscribe
                      preferences page.
        :type value: array(int)
        """
        if value is not None and len(value) > 25:
            raise ValueError("New groups_to_display exceeds max length of 25.")
        self._groups_to_display = value

    def get(self):
        """
        Get a JSON-ready representation of this GroupsToDisplay.

        :returns: This GroupsToDisplay, ready for use in a request body.
        :rtype: array of integers
        """
        return self.groups_to_display
