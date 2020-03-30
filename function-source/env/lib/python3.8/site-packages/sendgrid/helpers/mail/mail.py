"""Twilio SendGrid v3/mail/send response body builder"""
from .bcc_email import Bcc
from .cc_email import Cc
from .content import Content
from .custom_arg import CustomArg
from .email import Email
from .from_email import From
from .header import Header
from .html_content import HtmlContent
from .mime_type import MimeType
from .personalization import Personalization
from .plain_text_content import PlainTextContent
from .reply_to import ReplyTo
from .send_at import SendAt
from .subject import Subject
from .substitution import Substitution
from .template_id import TemplateId
from .to_email import To
from .dynamic_template_data import DynamicTemplateData


class Mail(object):
    """Creates the response body for v3/mail/send"""
    def __init__(
            self,
            from_email=None,
            to_emails=None,
            subject=None,
            plain_text_content=None,
            html_content=None,
            global_substitutions=None,
            is_multiple=False):
        """
        Creates the response body for a v3/mail/send API call

        :param from_email: The email address of the sender
        :type from_email: From, tuple, optional
        :param subject: The subject of the email
        :type subject: Subject, optional
        :param to_emails: The email address of the recipient
        :type to_emails: To, tuple, optional
        :param plain_text_content: The plain text body of the email
        :type plain_text_content: string, optional
        :param html_content: The html body of the email
        :type html_content: string, optional
        """
        self._attachments = None
        self._categories = None
        self._contents = None
        self._custom_args = None
        self._headers = None
        self._personalizations = []
        self._sections = None
        self._asm = None
        self._batch_id = None
        self._from_email = None
        self._ip_pool_name = None
        self._mail_settings = None
        self._reply_to = None
        self._send_at = None
        self._subject = None
        self._template_id = None
        self._tracking_settings = None

        # Minimum required data to send a single email
        if from_email is not None:
            self.from_email = from_email
        if to_emails is not None:
            self.add_to(to_emails, global_substitutions, is_multiple)
        if subject is not None:
            self.subject = subject
        if plain_text_content is not None:
            self.add_content(plain_text_content, MimeType.text)
        if html_content is not None:
            self.add_content(html_content, MimeType.html)

    def __str__(self):
        """A JSON-ready string representation of this Mail object.

        :returns: A JSON-ready string representation of this Mail object.
        :rtype: string
        """
        return str(self.get())

    def _ensure_append(self, new_items, append_to, index=0):
        """Ensure an item is appended to a list or create a new empty list

        :param new_items: the item(s) to append
        :type new_items: list(obj)
        :param append_to: the list on which to append the items
        :type append_to: list()
        :param index: index of the list on which to append the items
        :type index: int
        """
        append_to = append_to or []
        append_to.insert(index, new_items)
        return append_to

    def _ensure_insert(self, new_items, insert_to):
        """Ensure an item is inserted to a list or create a new empty list

        :param new_items: the item(s) to insert
        :type new_items: list(obj)
        :param insert_to: the list on which to insert the items at index 0
        :type insert_to: list()
        """
        insert_to = insert_to or []
        insert_to.insert(0, new_items)
        return insert_to

    def _flatten_dicts(self, dicts):
        """Flatten a dict

        :param dicts: Flatten a dict
        :type dicts: list(dict)
        """
        d = dict()
        list_of_dicts = [d.get() for d in dicts or []]
        return {k: v for d in list_of_dicts for k, v in d.items()}

    def _get_or_none(self, from_obj):
        """Get the JSON representation of the object, else return None

        :param from_obj: Get the JSON representation of the object,
        else return None
        :type from_obj: obj
        """
        return from_obj.get() if from_obj is not None else None

    def _set_emails(
            self, emails, global_substitutions=None, is_multiple=False, p=0):
        """Adds emails to the Personalization object

        :param emails: An Email or list of Email objects
        :type emails: Email, list(Email)
        :param global_substitutions: A dict of substitutions for all recipients
        :type global_substitutions: dict
        :param is_multiple: Create a new personilization for each recipient
        :type is_multiple: bool
        :param p: p is the Personalization object or Personalization object
                  index
        :type p: Personalization, integer, optional
        """
        # Send multiple emails to multiple recipients
        if is_multiple is True:
            if isinstance(emails, list):
                for email in emails:
                    personalization = Personalization()
                    personalization.add_email(email)
                    self.add_personalization(personalization)
            else:
                personalization = Personalization()
                personalization.add_email(emails)
                self.add_personalization(personalization)
            if global_substitutions is not None:
                if isinstance(global_substitutions, list):
                    for substitution in global_substitutions:
                        for p in self.personalizations:
                            p.add_substitution(substitution)
                else:
                    for p in self.personalizations:
                        p.add_substitution(global_substitutions)
        else:
            try:
                personalization = self._personalizations[p]
                has_internal_personalization = True
            except IndexError:
                personalization = Personalization()
                has_internal_personalization = False

            if isinstance(emails, list):
                for email in emails:
                    personalization.add_email(email)
            else:
                personalization.add_email(emails)

            if global_substitutions is not None:
                if isinstance(global_substitutions, list):
                    for substitution in global_substitutions:
                        personalization.add_substitution(substitution)
                else:
                    personalization.add_substitution(global_substitutions)

            if not has_internal_personalization:
                self.add_personalization(personalization, index=p)

    @property
    def personalizations(self):
        """A list of one or more Personaliztion objects

        :rtype: list(Personalization)
        """
        return self._personalizations

    def add_personalization(self, personalization, index=0):
        """Add a Personaliztion object

        :param personalizations: Add a Personalization object
        :type personalizations: Personalization
        :param index: The index where to add the Personalization
        :type index: int
        """
        self._personalizations = self._ensure_append(
            personalization, self._personalizations, index)

    @property
    def to(self):
        pass

    @to.setter
    def to(self, to_emails, global_substitutions=None, is_multiple=False, p=0):
        """Adds To objects to the Personalization object

        :param to_emails: An To or list of To objects
        :type to_emails: To, list(To), str, tuple
        :param global_substitutions: A dict of substitutions for all recipients
        :type global_substitutions: dict
        :param is_multiple: Create a new personilization for each recipient
        :type is_multiple: bool
        :param p: p is the Personalization object or Personalization object
                  index
        :type p: Personalization, integer, optional
        """
        if isinstance(to_emails, list):
            for email in to_emails:
                if isinstance(email, str):
                    email = To(email, None)
                if isinstance(email, tuple):
                    email = To(email[0], email[1])
                self.add_to(email, global_substitutions, is_multiple, p)
        else:
            if isinstance(to_emails, str):
                to_emails = To(to_emails, None)
            if isinstance(to_emails, tuple):
                to_emails = To(to_emails[0], to_emails[1])
            self.add_to(to_emails, global_substitutions, is_multiple, p)

    def add_to(
            self, to_email, global_substitutions=None, is_multiple=False, p=0):
        """Adds a To object to the Personalization object

        :param to_emails: A To object
        :type to_emails: To, str, tuple
        :param global_substitutions: A dict of substitutions for all recipients
        :type global_substitutions: dict
        :param is_multiple: Create a new personilization for each recipient
        :type is_multiple: bool
        :param p: p is the Personalization object or Personalization object
                  index
        :type p: Personalization, integer, optional
        """

        if isinstance(to_email, list):
            for email in to_email:
                if isinstance(email, str):
                    email = To(email, None)
                if isinstance(email, tuple):
                    email = To(email[0], email[1])
                self._set_emails(email, global_substitutions, is_multiple, p)
        else:
            if isinstance(to_email, str):
                to_email = To(to_email, None)
            if isinstance(to_email, tuple):
                to_email = To(to_email[0], to_email[1])
            if isinstance(to_email, Email):
                p = to_email.personalization
            self._set_emails(to_email, global_substitutions, is_multiple, p)

    @property
    def cc(self):
        pass

    @cc.setter
    def cc(self, cc_emails, global_substitutions=None, is_multiple=False, p=0):
        """Adds Cc objects to the Personalization object

        :param cc_emails: An Cc or list of Cc objects
        :type cc_emails: Cc, list(Cc), tuple
        :param global_substitutions: A dict of substitutions for all recipients
        :type global_substitutions: dict
        :param is_multiple: Create a new personilization for each recipient
        :type is_multiple: bool
        :param p: p is the Personalization object or Personalization object
                  index
        :type p: Personalization, integer, optional
        """
        if isinstance(cc_emails, list):
            for email in cc_emails:
                if isinstance(email, str):
                    email = Cc(email, None)
                if isinstance(email, tuple):
                    email = Cc(email[0], email[1])
                self.add_cc(email, global_substitutions, is_multiple, p)
        else:
            if isinstance(cc_emails, str):
                cc_emails = Cc(cc_emails, None)
            if isinstance(cc_emails, tuple):
                cc_emails = To(cc_emails[0], cc_emails[1])
            self.add_cc(cc_emails, global_substitutions, is_multiple, p)

    def add_cc(
            self, cc_email, global_substitutions=None, is_multiple=False, p=0):
        """Adds a Cc object to the Personalization object

        :param to_emails: An Cc object
        :type to_emails: Cc
        :param global_substitutions: A dict of substitutions for all recipients
        :type global_substitutions: dict
        :param is_multiple: Create a new personilization for each recipient
        :type is_multiple: bool
        :param p: p is the Personalization object or Personalization object
                  index
        :type p: Personalization, integer, optional
        """
        if isinstance(cc_email, str):
            cc_email = Cc(cc_email, None)
        if isinstance(cc_email, tuple):
            cc_email = Cc(cc_email[0], cc_email[1])
        if isinstance(cc_email, Email):
            p = cc_email.personalization
        self._set_emails(
            cc_email, global_substitutions, is_multiple=is_multiple, p=p)

    @property
    def bcc(self):
        pass

    @bcc.setter
    def bcc(
            self,
            bcc_emails,
            global_substitutions=None,
            is_multiple=False,
            p=0):
        """Adds Bcc objects to the Personalization object

        :param bcc_emails: An Bcc or list of Bcc objects
        :type bcc_emails: Bcc, list(Bcc), tuple
        :param global_substitutions: A dict of substitutions for all recipients
        :type global_substitutions: dict
        :param is_multiple: Create a new personilization for each recipient
        :type is_multiple: bool
        :param p: p is the Personalization object or Personalization object
                  index
        :type p: Personalization, integer, optional
        """
        if isinstance(bcc_emails, list):
            for email in bcc_emails:
                if isinstance(email, str):
                    email = Bcc(email, None)
                if isinstance(email, tuple):
                    email = Bcc(email[0], email[1])
                self.add_bcc(email, global_substitutions, is_multiple, p)
        else:
            if isinstance(bcc_emails, str):
                bcc_emails = Bcc(bcc_emails, None)
            if isinstance(bcc_emails, tuple):
                bcc_emails = Bcc(bcc_emails[0], bcc_emails[1])
            self.add_bcc(bcc_emails, global_substitutions, is_multiple, p)

    def add_bcc(
            self,
            bcc_email,
            global_substitutions=None,
            is_multiple=False,
            p=0):
        """Adds a Bcc object to the Personalization object

        :param to_emails: An Bcc object
        :type to_emails: Bcc
        :param global_substitutions: A dict of substitutions for all recipients
        :type global_substitutions: dict
        :param is_multiple: Create a new personilization for each recipient
        :type is_multiple: bool
        :param p: p is the Personalization object or Personalization object
                  index
        :type p: Personalization, integer, optional
        """
        if isinstance(bcc_email, str):
            bcc_email = Bcc(bcc_email, None)
        if isinstance(bcc_email, tuple):
            bcc_email = Bcc(bcc_email[0], bcc_email[1])
        if isinstance(bcc_email, Email):
            p = bcc_email.personalization
        self._set_emails(
            bcc_email,
            global_substitutions,
            is_multiple=is_multiple,
            p=p)

    @property
    def subject(self):
        """The global Subject object

        :rtype: Subject
        """
        return self._subject

    @subject.setter
    def subject(self, value):
        """The subject of the email(s)

        :param value: The subject of the email(s)
        :type value: Subject, string
        """
        if isinstance(value, Subject):
            if value.personalization is not None:
                try:
                    personalization = \
                        self._personalizations[value.personalization]
                    has_internal_personalization = True
                except IndexError:
                    personalization = Personalization()
                    has_internal_personalization = False
                personalization.subject = value.subject

                if not has_internal_personalization:
                    self.add_personalization(
                        personalization,
                        index=value.personalization)
            else:
                self._subject = value
        else:
            self._subject = Subject(value)

    @property
    def headers(self):
        """A list of global Header objects

        :rtype: list(Header)
        """
        return self._headers

    @property
    def header(self):
        pass

    @header.setter
    def header(self, headers):
        """Add headers to the email

        :param value: A list of Header objects or a dict of header key/values
        :type value: Header, list(Header), dict
        """
        if isinstance(headers, list):
            for h in headers:
                self.add_header(h)
        else:
            self.add_header(headers)

    def add_header(self, header):
        """Add headers to the email globaly or to a specific Personalization

        :param value: A Header object or a dict of header key/values
        :type value: Header, dict
        """
        if header.personalization is not None:
            try:
                personalization = \
                    self._personalizations[header.personalization]
                has_internal_personalization = True
            except IndexError:
                personalization = Personalization()
                has_internal_personalization = False
            if isinstance(header, dict):
                (k, v) = list(header.items())[0]
                personalization.add_header(Header(k, v))
            else:
                personalization.add_header(header)

            if not has_internal_personalization:
                self.add_personalization(
                    personalization,
                    index=header.personalization)
        else:
            if isinstance(header, dict):
                (k, v) = list(header.items())[0]
                self._headers = self._ensure_append(
                                    Header(k, v), self._headers)
            else:
                self._headers = self._ensure_append(header, self._headers)

    @property
    def substitution(self):
        pass

    @substitution.setter
    def substitution(self, substitution):
        """Add substitutions to the email

        :param value: Add substitutions to the email
        :type value: Substitution, list(Substitution)
        """
        if isinstance(substitution, list):
            for s in substitution:
                self.add_substitution(s)
        else:
            self.add_substitution(substitution)

    def add_substitution(self, substitution):
        """Add a substitution to the email

        :param value: Add a substitution to the email
        :type value: Substitution
        """
        if substitution.personalization:
            try:
                personalization = \
                    self._personalizations[substitution.personalization]
                has_internal_personalization = True
            except IndexError:
                personalization = Personalization()
                has_internal_personalization = False
            personalization.add_substitution(substitution)

            if not has_internal_personalization:
                self.add_personalization(
                    personalization, index=substitution.personalization)
        else:
            if isinstance(substitution, list):
                for s in substitution:
                    for p in self.personalizations:
                        p.add_substitution(s)
            else:
                for p in self.personalizations:
                    p.add_substitution(substitution)

    @property
    def custom_args(self):
        """A list of global CustomArg objects

        :rtype: list(CustomArg)
        """
        return self._custom_args

    @property
    def custom_arg(self):
        return self._custom_args

    @custom_arg.setter
    def custom_arg(self, custom_arg):
        """Add custom args to the email

        :param value: A list of CustomArg objects or a dict of custom arg
                      key/values
        :type value: CustomArg, list(CustomArg), dict
        """
        if isinstance(custom_arg, list):
            for c in custom_arg:
                self.add_custom_arg(c)
        else:
            self.add_custom_arg(custom_arg)

    def add_custom_arg(self, custom_arg):
        """Add custom args to the email globaly or to a specific Personalization

        :param value: A CustomArg object or a dict of custom arg key/values
        :type value: CustomArg, dict
        """
        if custom_arg.personalization is not None:
            try:
                personalization = \
                    self._personalizations[custom_arg.personalization]
                has_internal_personalization = True
            except IndexError:
                personalization = Personalization()
                has_internal_personalization = False
            if isinstance(custom_arg, dict):
                (k, v) = list(custom_arg.items())[0]
                personalization.add_custom_arg(CustomArg(k, v))
            else:
                personalization.add_custom_arg(custom_arg)

            if not has_internal_personalization:
                self.add_personalization(
                    personalization, index=custom_arg.personalization)
        else:
            if isinstance(custom_arg, dict):
                (k, v) = list(custom_arg.items())[0]
                self._custom_args = self._ensure_append(
                    CustomArg(k, v), self._custom_args)
            else:
                self._custom_args = self._ensure_append(
                    custom_arg, self._custom_args)

    @property
    def send_at(self):
        """The global SendAt object

        :rtype: SendAt
        """
        return self._send_at

    @send_at.setter
    def send_at(self, value):
        """A unix timestamp specifying when your email should
        be delivered.

        :param value: A unix timestamp specifying when your email should
        be delivered.
        :type value: SendAt, int
        """
        if isinstance(value, SendAt):
            if value.personalization is not None:
                try:
                    personalization = \
                        self._personalizations[value.personalization]
                    has_internal_personalization = True
                except IndexError:
                    personalization = Personalization()
                    has_internal_personalization = False
                personalization.send_at = value.send_at

                if not has_internal_personalization:
                    self.add_personalization(
                        personalization, index=value.personalization)
            else:
                self._send_at = value
        else:
            self._send_at = SendAt(value)

    @property
    def dynamic_template_data(self):
        pass

    @dynamic_template_data.setter
    def dynamic_template_data(self, value):
        """Data for a transactional template

        :param value: Data for a transactional template
        :type value: DynamicTemplateData, a JSON-serializeable structure
        """
        if not isinstance(value, DynamicTemplateData):
            value = DynamicTemplateData(value)
        try:
            personalization = self._personalizations[value.personalization]
            has_internal_personalization = True
        except IndexError:
            personalization = Personalization()
            has_internal_personalization = False
        personalization.dynamic_template_data = value.dynamic_template_data

        if not has_internal_personalization:
            self.add_personalization(
                personalization, index=value.personalization)

    @property
    def from_email(self):
        """The email address of the sender

        :rtype: From
        """
        return self._from_email

    @from_email.setter
    def from_email(self, value):
        """The email address of the sender

        :param value: The email address of the sender
        :type value: From, str, tuple
        """
        if isinstance(value, str):
            value = From(value, None)
        if isinstance(value, tuple):
            value = From(value[0], value[1])
        self._from_email = value

    @property
    def reply_to(self):
        """The reply to email address

        :rtype: ReplyTo
        """
        return self._reply_to

    @reply_to.setter
    def reply_to(self, value):
        """The reply to email address

        :param value: The reply to email address
        :type value: ReplyTo, str, tuple
        """
        if isinstance(value, str):
            value = ReplyTo(value, None)
        if isinstance(value, tuple):
            value = ReplyTo(value[0], value[1])
        self._reply_to = value

    @property
    def contents(self):
        """The contents of the email

        :rtype: list(Content)
        """
        return self._contents

    @property
    def content(self):
        pass

    @content.setter
    def content(self, contents):
        """The content(s) of the email

        :param contents: The content(s) of the email
        :type contents: Content, list(Content)
        """
        if isinstance(contents, list):
            for c in contents:
                self.add_content(c)
        else:
            self.add_content(contents)

    def add_content(self, content, mime_type=None):
        """Add content to the email

        :param contents: Content to be added to the email
        :type contents: Content
        :param mime_type: Override the mime type
        :type mime_type: MimeType, str
        """
        if isinstance(content, str):
            content = Content(mime_type, content)
        # Content of mime type text/plain must always come first
        if content.mime_type == "text/plain":
            self._contents = self._ensure_insert(content, self._contents)
        else:
            if self._contents:
                index = len(self._contents)
            else:
                index = 0
            self._contents = self._ensure_append(
                content, self._contents, index=index)

    @property
    def attachments(self):
        """The attachments to this email

        :rtype: list(Attachment)
        """
        return self._attachments

    @property
    def attachment(self):
        pass

    @attachment.setter
    def attachment(self, attachment):
        """Add attachment(s) to this email

        :param attachment: Add attachment(s) to this email
        :type attachment: Attachment, list(Attachment)
        """
        if isinstance(attachment, list):
            for a in attachment:
                self.add_attachment(a)
        else:
            self.add_attachment(attachment)

    def add_attachment(self, attachment):
        """Add an attachment to this email

        :param attachment: Add an attachment to this email
        :type attachment: Attachment
        """
        self._attachments = self._ensure_append(attachment, self._attachments)

    @property
    def template_id(self):
        """The transactional template id for this email

        :rtype: TemplateId
        """
        return self._template_id

    @template_id.setter
    def template_id(self, value):
        """The transactional template id for this email

        :param value: The transactional template id for this email
        :type value: TemplateId
        """
        if isinstance(value, TemplateId):
            self._template_id = value
        else:
            self._template_id = TemplateId(value)

    @property
    def sections(self):
        """The block sections of code to be used as substitutions

        :rtype: Section
        """
        return self._sections

    @property
    def section(self):
        pass

    @section.setter
    def section(self, section):
        """The block sections of code to be used as substitutions

        :rtype: Section, list(Section)
        """
        if isinstance(section, list):
            for h in section:
                self.add_section(h)
        else:
            self.add_section(section)

    def add_section(self, section):
        """A block section of code to be used as substitutions

        :param section: A block section of code to be used as substitutions
        :type section: Section
        """
        self._sections = self._ensure_append(section, self._sections)

    @property
    def categories(self):
        """The categories assigned to this message

        :rtype: list(Category)
        """
        return self._categories

    @property
    def category(self):
        pass

    @category.setter
    def category(self, categories):
        """Add categories assigned to this message

        :rtype: list(Category)
        """
        if isinstance(categories, list):
            for c in categories:
                self.add_category(c)
        else:
            self.add_category(categories)

    def add_category(self, category):
        """Add a category assigned to this message

        :rtype: Category
        """
        self._categories = self._ensure_append(category, self._categories)

    @property
    def batch_id(self):
        """The batch id for this email

        :rtype: BatchId
        """
        return self._batch_id

    @batch_id.setter
    def batch_id(self, value):
        """The batch id for this email

        :param value: The batch id for this email
        :type value: BatchId
        """
        self._batch_id = value

    @property
    def asm(self):
        """An object specifying unsubscribe behavior.

        :rtype: Asm
        """
        return self._asm

    @asm.setter
    def asm(self, value):
        """An object specifying unsubscribe behavior.

        :param value: An object specifying unsubscribe behavior.
        :type value: Asm
        """
        self._asm = value

    @property
    def ip_pool_name(self):
        """The IP Pool that you would like to send this email from

        :rtype: IpPoolName
        """
        return self._ip_pool_name

    @ip_pool_name.setter
    def ip_pool_name(self, value):
        """The IP Pool that you would like to send this email from

        :paran value: The IP Pool that you would like to send this email from
        :type value: IpPoolName
        """
        self._ip_pool_name = value

    @property
    def mail_settings(self):
        """The mail settings for this email

        :rtype: MailSettings
        """
        return self._mail_settings

    @mail_settings.setter
    def mail_settings(self, value):
        """The mail settings for this email

        :param value: The mail settings for this email
        :type value: MailSettings
        """
        self._mail_settings = value

    @property
    def tracking_settings(self):
        """The tracking settings for this email

        :rtype: TrackingSettings
        """
        return self._tracking_settings

    @tracking_settings.setter
    def tracking_settings(self, value):
        """The tracking settings for this email

        :param value: The tracking settings for this email
        :type value: TrackingSettings
        """
        self._tracking_settings = value

    def get(self):
        """
        Get a JSON-ready representation of this Mail object.

        :returns: This Mail object, ready for use in a request body.
        :rtype: dict
        """
        mail = {
            'from': self._get_or_none(self.from_email),
            'subject': self._get_or_none(self.subject),
            'personalizations': [p.get() for p in self.personalizations or []],
            'content': [c.get() for c in self.contents or []],
            'attachments': [a.get() for a in self.attachments or []],
            'template_id': self._get_or_none(self.template_id),
            'sections': self._flatten_dicts(self.sections),
            'headers': self._flatten_dicts(self.headers),
            'categories': [c.get() for c in self.categories or []],
            'custom_args': self._flatten_dicts(self.custom_args),
            'send_at':  self._get_or_none(self.send_at),
            'batch_id': self._get_or_none(self.batch_id),
            'asm': self._get_or_none(self.asm),
            'ip_pool_name': self._get_or_none(self.ip_pool_name),
            'mail_settings': self._get_or_none(self.mail_settings),
            'tracking_settings': self._get_or_none(self.tracking_settings),
            'reply_to': self._get_or_none(self.reply_to),
        }

        return {key: value for key, value in mail.items()
                if value is not None and value != [] and value != {}}

    @classmethod
    def from_EmailMessage(cls, message):
        """Create a Mail object from an instance of
        email.message.EmailMessage.

        :type message: email.message.EmailMessage
        :rtype: Mail
        """
        mail = cls(
            from_email=Email(message.get('From')),
            subject=message.get('Subject'),
            to_emails=Email(message.get('To')),
        )
        try:
            body = message.get_content()
        except AttributeError:
            # Python2
            body = message.get_payload()
        mail.add_content(Content(
            message.get_content_type(),
            body.strip()
        ))
        for k, v in message.items():
            mail.add_header(Header(k, v))
        return mail
