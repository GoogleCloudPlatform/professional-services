from .group_id import GroupId
from .groups_to_display import GroupsToDisplay


class Asm(object):
    """An object specifying unsubscribe behavior."""

    def __init__(self, group_id, groups_to_display=None):
        """Create an ASM with the given group_id and groups_to_display.

        :param group_id: ID of an unsubscribe group
        :type group_id: GroupId, int, required
        :param groups_to_display: Unsubscribe groups to display
        :type groups_to_display: GroupsToDisplay, list(int), optional
        """
        self._group_id = None
        self._groups_to_display = None

        if group_id is not None:
            self.group_id = group_id

        if groups_to_display is not None:
            self.groups_to_display = groups_to_display

    @property
    def group_id(self):
        """The unsubscribe group to associate with this email.

        :rtype: GroupId
        """
        return self._group_id

    @group_id.setter
    def group_id(self, value):
        """The unsubscribe group to associate with this email.

        :param value: ID of an unsubscribe group
        :type value: GroupId, int, required
        """
        if isinstance(value, GroupId):
            self._group_id = value
        else:
            self._group_id = GroupId(value)

    @property
    def groups_to_display(self):
        """The unsubscribe groups that you would like to be displayed on the
        unsubscribe preferences page. Max of 25 groups.

        :rtype: GroupsToDisplay
        """
        return self._groups_to_display

    @groups_to_display.setter
    def groups_to_display(self, value):
        """An array containing the unsubscribe groups that you would like to
        be displayed on the unsubscribe preferences page. Max of 25 groups.

        :param groups_to_display: Unsubscribe groups to display
        :type groups_to_display: GroupsToDisplay, list(int), optional
        """
        if isinstance(value, GroupsToDisplay):
            self._groups_to_display = value
        else:
            self._groups_to_display = GroupsToDisplay(value)

    def get(self):
        """
        Get a JSON-ready representation of this ASM object.

        :returns: This ASM object, ready for use in a request body.
        :rtype: dict
        """
        asm = {}
        if self.group_id is not None:
            asm["group_id"] = self.group_id.get()

        if self.groups_to_display is not None:
            asm["groups_to_display"] = self.groups_to_display.get()
        return asm
