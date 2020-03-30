from .file_content import FileContent
from .file_type import FileType
from .file_name import FileName
from .disposition import Disposition
from .content_id import ContentId


class Attachment(object):
    """An attachment to be included with an email."""

    def __init__(
            self,
            file_content=None,
            file_name=None,
            file_type=None,
            disposition=None,
            content_id=None):
        """Create an Attachment

        :param file_content: The Base64 encoded content of the attachment
        :type file_content: FileContent, string
        :param file_name: The filename of the attachment
        :type file_name: FileName, string
        :param file_type: The MIME type of the content you are attaching
        :type file_type FileType, string, optional
        :param disposition: The content-disposition of the attachment,
                            specifying display style. Specifies how you
                            would like the attachment to be displayed.
                            - "inline" results in the attached file being
                              displayed automatically within the message.
                            - "attachment" results in the attached file
                              requiring some action to display (e.g. opening
                              or downloading the file).
                            If unspecified, "attachment" is used. Must be one
                            of the two choices.
        :type disposition: Disposition, string, optional
        :param content_id: The content id for the attachment.
                           This is used when the Disposition is set to
                           "inline" and the attachment is an image, allowing
                           the file to be displayed within the email body.
        :type content_id: ContentId, string, optional
        """
        self._file_content = None
        self._file_type = None
        self._file_name = None
        self._disposition = None
        self._content_id = None

        if file_content is not None:
            self.file_content = file_content

        if file_type is not None:
            self.file_type = file_type

        if file_name is not None:
            self.file_name = file_name

        if disposition is not None:
            self.disposition = disposition

        if content_id is not None:
            self.content_id = content_id

    @property
    def file_content(self):
        """The Base64 encoded content of the attachment.

        :rtype: FileContent
        """
        return self._file_content

    @file_content.setter
    def file_content(self, value):
        """The Base64 encoded content of the attachment

        :param value: The Base64 encoded content of the attachment
        :type value: FileContent, string
        """
        if isinstance(value, FileContent):
            self._file_content = value
        else:
            self._file_content = FileContent(value)

    @property
    def file_name(self):
        """The file name of the attachment.

        :rtype: FileName
        """
        return self._file_name

    @file_name.setter
    def file_name(self, value):
        """The filename of the attachment

        :param file_name: The filename of the attachment
        :type file_name: FileName, string
        """
        if isinstance(value, FileName):
            self._file_name = value
        else:
            self._file_name = FileName(value)

    @property
    def file_type(self):
        """The MIME type of the content you are attaching.

        :rtype: FileType
        """
        return self._file_type

    @file_type.setter
    def file_type(self, value):
        """The MIME type of the content you are attaching

        :param file_type: The MIME type of the content you are attaching
        :type file_type FileType, string, optional
        """
        if isinstance(value, FileType):
            self._file_type = value
        else:
            self._file_type = FileType(value)

    @property
    def disposition(self):
        """The content-disposition of the attachment, specifying display style.

        Specifies how you would like the attachment to be displayed.
         - "inline" results in the attached file being displayed automatically
            within the message.
         - "attachment" results in the attached file requiring some action to
            display (e.g. opening or downloading the file).
        If unspecified, "attachment" is used. Must be one of the two choices.

        :rtype: Disposition
        """
        return self._disposition

    @disposition.setter
    def disposition(self, value):
        """The content-disposition of the attachment, specifying display style.

        Specifies how you would like the attachment to be displayed.
         - "inline" results in the attached file being displayed automatically
            within the message.
         - "attachment" results in the attached file requiring some action to
            display (e.g. opening or downloading the file).
        If unspecified, "attachment" is used. Must be one of the two choices.

        :param disposition: The content-disposition of the attachment,
                            specifying display style. Specifies how you would
                            like the attachment to be displayed.
                            - "inline" results in the attached file being
                              displayed automatically within the message.
                            - "attachment" results in the attached file
                              requiring some action to display (e.g. opening
                              or downloading the file).
                            If unspecified, "attachment" is used. Must be one
                            of the two choices.
        :type disposition: Disposition, string, optional
        """
        if isinstance(value, Disposition):
            self._disposition = value
        else:
            self._disposition = Disposition(value)

    @property
    def content_id(self):
        """The content id for the attachment.

        This is used when the disposition is set to "inline" and the attachment
        is an image, allowing the file to be displayed within the email body.

        :rtype: string
        """
        return self._content_id

    @content_id.setter
    def content_id(self, value):
        """The content id for the attachment.

        This is used when the disposition is set to "inline" and the attachment
        is an image, allowing the file to be displayed within the email body.

        :param content_id: The content id for the attachment.
                           This is used when the Disposition is set to "inline"
                           and the attachment is an image, allowing the file to
                           be displayed within the email body.
        :type content_id: ContentId, string, optional
        """
        if isinstance(value, ContentId):
            self._content_id = value
        else:
            self._content_id = ContentId(value)

    def get(self):
        """
        Get a JSON-ready representation of this Attachment.

        :returns: This Attachment, ready for use in a request body.
        :rtype: dict
        """
        attachment = {}
        if self.file_content is not None:
            attachment["content"] = self.file_content.get()

        if self.file_type is not None:
            attachment["type"] = self.file_type.get()

        if self.file_name is not None:
            attachment["filename"] = self.file_name.get()

        if self.disposition is not None:
            attachment["disposition"] = self.disposition.get()

        if self.content_id is not None:
            attachment["content_id"] = self.content_id.get()
        return attachment
