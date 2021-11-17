#   Copyright 2021 Google LLC
#
#   Licensed under the Apache License, Version 2.0 (the "License");
#   you may not use this file except in compliance with the License.
#   You may obtain a copy of the License at
#
#       http://www.apache.org/licenses/LICENSE-2.0
#
#   Unless required by applicable law or agreed to in writing, software
#   distributed under the License is distributed on an "AS IS" BASIS,
#   WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
#   See the License for the specific language governing permissions and
#   limitations under the License.
from .base import Output, NotConfiguredException
import os
import email
import base64
from email import encoders
import smtplib, ssl
import urllib
from googleapiclient import discovery, errors
from email.mime.base import MIMEBase
from email.mime.text import MIMEText
from email.mime.image import MIMEImage
from email.mime.multipart import MIMEMultipart
import sendgrid
from sendgrid.helpers.mail import Attachment
from google.oauth2.credentials import Credentials
from google.cloud import storage
from python_http_client import exceptions


class InvalidSchemeException(Exception):
    pass


class DownloadFailedException(Exception):
    pass


class MultipleSendersException(Exception):
    pass


class GroupNotFoundException(Exception):
    pass


class AllTransportsFailedException(Exception):
    pass


class MailOutput(Output):

    def _get_attachment(self, url):
        parsed_url = urllib.parse.urlparse(url)
        if parsed_url.scheme != 'gs':
            raise InvalidSchemeException(
                'Invalid scheme for generate_signed_url: %s' %
                parsed_url.scheme)
        client = storage.Client()
        bucket = client.bucket(parsed_url.netloc)
        blob = bucket.get_blob(urllib.parse.unquote(parsed_url.path[1:]))
        if not blob:
            raise DownloadFailedException('Unable to download attachment.')
        blob_string = blob.download_as_string()
        if len(blob_string) == 0:
            self.logger.warning(
                'Empty attachment (0 bytes) detected, skipping...',
                extra={'url': url})
            return None, None
        return os.path.basename(blob.name), blob_string

    def expand_recipients(self, mail, config):
        """Expands group recipients using the Directory API"""
        to_emails = email.utils.getaddresses([mail['mail_to']])
        self.logger.debug('Starting expansion of group recipients...',
                          extra={'to': to_emails})

        service_account = config[
            'serviceAccountEmail'] if 'serviceAccountEmail' in config else None
        user_credentials = Credentials(
            self.get_token_for_scopes([
                'https://www.googleapis.com/auth/admin.directory.user.readonly'
            ],
                                      service_account=service_account))
        group_credentials = Credentials(
            self.get_token_for_scopes([
                'https://www.googleapis.com/auth/cloud-identity.groups.readonly'
            ],
                                      service_account=service_account))

        user_service = discovery.build('admin',
                                       'directory_v1',
                                       credentials=user_credentials)
        group_service = discovery.build('cloudidentity',
                                        'v1beta1',
                                        credentials=group_credentials)
        new_emails = []
        for e in to_emails:
            request = group_service.groups().lookup()
            request.uri += "&groupKey.id=" + e[1]
            try:
                response = request.execute()
            except errors.HttpError as exc:
                if exc.resp.status == 404 or exc.resp.status == 403:
                    self.logger.debug(
                        'Did not find group %s in Cloud Identity.' % (e[1]),
                        extra={'response': exc.resp})
                    response = None
                else:
                    raise exc
            if response and 'name' in response:
                m_request = group_service.groups().memberships().list(
                    parent=response['name'])
                m_response = m_request.execute()
                if 'memberships' in m_response:  # If this field doesn't exist, it's probably an empty group
                    for membership in m_response['memberships']:
                        new_emails.append(
                            email.utils.formataddr(
                                ('', membership['memberKey']['id'])))
            else:
                try:
                    u_response = user_service.users().get(
                        userKey=e[1]).execute()
                    if u_response:
                        new_emails.append(e[1])
                except errors.HttpError as exc:
                    if not 'ignoreNonexistentGroups' in config or not config[
                            'ignoreNonexistentGroups']:
                        raise GroupNotFoundException(
                            'Failed to find group %s in Cloud Identity!' % e[1])
                    elif 'ignoreNonexistentGroups' in config and isinstance(
                            config['ignoreNonexistentGroups'],
                            str) and not e[1].endswith(
                                config['ignoreNonexistentGroups']):
                        new_emails.append(e[1])
                    else:
                        self.logger.debug('Non-existent user %s skipped.' %
                                          (e[1]),
                                          extra={'response': exc.resp})

        new_to = ''
        for e in new_emails:
            new_to += ', ' if new_to != '' else ''
            new_to += e
        mail['mail_to'] = new_to
        self.logger.debug('Finished expanding group recipients.',
                          extra={'to': new_to})
        return mail

    def send_via_smtp(self, transport, mail, embedded_images, config):
        if 'host' not in transport:
            raise NotConfiguredException(
                'No host configured for SMTP transport.')

        port = int(transport['port']) if 'port' in transport else 25
        self.logger.debug('Trying transport.',
                          extra={
                              'host': transport['host'],
                              'port': port
                          })

        server = None
        if 'verifyCertificate' in transport and transport[
                'verifyCertificate'] == False:
            context = ssl._create_unverified_context()
        else:
            context = ssl.create_default_context()
        if 'ssl' in transport and transport['ssl']:
            self.logger.debug('Using SSL connection for SMTP.')
            server = smtplib.SMTP_SSL(transport['host'], port, context=context)
        else:
            server = smtplib.SMTP(transport['host'], port)
            if 'starttls' in transport and transport['starttls']:
                self.logger.debug('Using STARTTLS for SMTP.')
                server.starttls(context=context)
        if 'user' in transport and 'password' in transport:
            self.logger.debug('Logging into SMTP server.')
            server.login(transport['user'], transport['password'])

        message = MIMEMultipart('alternative')
        message['Subject'] = mail['mail_subject']
        message['From'] = mail['mail_from']
        message['To'] = mail['mail_to']

        if mail['text_body'] != '':
            text_part = MIMEText(mail['text_body'], 'plain')
            message.attach(text_part)
        if mail['html_body'] != '':
            html_part = MIMEText(mail['html_body'], 'html')
            message.attach(html_part)

        if 'attachments' in config['body']:
            for attachment in config['body']['attachments']:
                attachment_template = self.jinja_environment.from_string(
                    attachment)
                attachment_template.name = 'attachment'
                attachment_url = attachment_template.render()
                self.logger.debug('Fetching attachment...',
                                  extra={'attachment': attachment_url})

                filename, content = self._get_attachment(attachment_url)
                if filename:
                    file_part = MIMEBase('application', 'octet-stream')
                    file_part.set_payload(content)
                    encoders.encode_base64(file_part)
                    file_part.add_header('Content-Disposition',
                                         'attachment; filename="%s"' % filename)
                    self.logger.debug('Attached file.',
                                      extra={
                                          'attachment_filename': filename,
                                          'attachment_size': len(content)
                                      })
                    message.attach(file_part)

        if len(embedded_images) > 0:
            for file_name, content in embedded_images.items():
                image = MIMEImage(content)
                image.add_header('Content-ID', '<%s>' % file_name)
                image.add_header(
                    'Content-Disposition', 'inline; filename="%s"; size="%d";' %
                    (file_name, len(content)))
                message.attach(image)

        parsed_recipients = email.utils.getaddresses([mail['mail_to']])
        recipients = []
        for r in parsed_recipients:
            recipients.append(r[1])

        self.logger.debug('Sending email thru SMTP.',
                          extra={'recipients': recipients})
        server.sendmail(mail['mail_from'], recipients, message.as_string())

        server.quit()
        return True

    def send_via_sendgrid(self, transport, mail, embedded_images, config):
        api_key = None
        if 'apiKey' in transport:
            api_key = transport['apiKey']
        if os.getenv('SENDGRID_API_KEY'):
            api_key = os.getenv('SENDGRID_API_KEY')
        if not api_key:
            raise NotConfiguredException('No Sendgrid API key configured!')

        sg = sendgrid.SendGridAPIClient(api_key=api_key)
        from_email = sendgrid.Email(mail['mail_from'])
        to_email = sendgrid.To(mail['mail_to'])
        text_content = None
        if mail['text_body'] != '':
            text_content = sendgrid.Content('text/plain', mail['text_body'])
        sendgrid_mail = sendgrid.Mail(from_email, to_email,
                                      mail['mail_subject'], text_content)
        if mail['html_body'] != '':
            html_content = sendgrid.Content('text/html', mail['html_body'])
            sendgrid_mail.add_content(html_content)
        if len(embedded_images) > 0:
            for file_name, content in embedded_images.items():
                attachment = Attachment()
                attachment.file_content = base64.b64encode(content).decode()
                attachment.file_type = 'application/octet-stream'
                attachment.file_name = file_name
                attachment.disposition = 'inline'
                attachment.content_id = file_name
                sendgrid_mail.attachment = attachment

        if 'attachments' in config['body']:
            for attachment in config['body']['attachments']:
                attachment_template = self.jinja_environment.from_string(
                    attachment)
                attachment_template.name = 'attachment'
                attachment_url = attachment_template.render()
                self.logger.debug('Fetching attachment...',
                                  extra={'attachment': attachment_url})

                filename, content = self._get_attachment(attachment_url)
                if filename:
                    attachment = Attachment()
                    attachment.file_content = base64.b64encode(content).decode()
                    attachment.file_type = 'application/octet-stream'
                    attachment.file_name = filename
                    attachment.disposition = 'attachment'
                    attachment.content_id = filename
                    sendgrid_mail.attachment = attachment

                    self.logger.debug('Attached file.',
                                      extra={
                                          'attachment_filename': filename,
                                          'attachment_size': len(content)
                                      })

        self.logger.debug('Sending email through SendGrid.')
        try:
            response = sg.client.mail.send.post(
                request_body=sendgrid_mail.get())
        except exceptions.BadRequestsError as e:
            self.logger.error('Failed to send via SendGrid (bad request).',
                              extra={'response': e.body})
            raise e
        if response.status_code >= 200 and response.status_code <= 299:
            return True
        return False

    def embed_images(self, config):
        embedded_images = {}
        for image in config['body']['images']:
            image_template = self.jinja_environment.from_string(image)
            image_template.name = 'image'
            image_url = image_template.render()
            self.logger.debug('Fetching attached image...',
                              extra={'image': image_url})

            image_filename = None
            if image_url.startswith('gs://'):  # Cloud Storage file
                image_filename, image_content = self._get_attachment(image_url)
            else:
                if os.path.exists(image_url):  # Local file
                    image_filename = os.path.basename(image_url)
                    image_content = open(image_url, 'rb').read()
                else:
                    self.logger.error('Could not find image attachment.',
                                      extra={'image': image_url})
            if image_filename:
                embedded_images[image_filename] = image_content
                self.logger.debug('Attaching embedded image.',
                                  extra={
                                      'image': image_url,
                                      'image_name': image_filename,
                                      'size': len(image_content)
                                  })
        return embedded_images

    def output(self):
        mail = {
            'html_body': '',
            'text_body': '',
            'mail_from': '',
            'mail_to': '',
            'mail_subject': '',
        }

        if 'from' not in self.output_config:
            raise NotConfiguredException(
                'No sender (from) configured for email output!')
        if 'to' not in self.output_config:
            raise NotConfiguredException(
                'No recipient (to) configured for email output!')
        if 'subject' not in self.output_config:
            raise NotConfiguredException(
                'No subject configured for email output!')

        if 'body' not in self.output_config:
            raise NotConfiguredException('No body configured for email output!')

        for mail_type in ['html', 'text']:
            if mail_type in self.output_config['body']:
                mail_template = self.jinja_environment.from_string(
                    self.output_config['body'][mail_type])
                mail_template.name = mail_type
                mail['%s_body' % mail_type] = mail_template.render()

        if mail['html_body'] == '' and mail['text_body'] == '':
            raise NotConfiguredException(
                'No HMTL or text email body configured for email output!')

        for tpl in ['from', 'to', 'subject']:
            mail_template = self.jinja_environment.from_string(
                self.output_config[tpl])
            mail['mail_%s' % tpl] = mail_template.render()

        self.logger.debug('Canonicalizing email formats...')
        # Canonicalize the email formats
        for tpl in ['from', 'to']:
            parsed_emails = email.utils.getaddresses([mail['mail_%s' % tpl]])
            if tpl == 'from' and len(parsed_emails) > 1:
                raise MultipleSendersException(
                    'Multiple senders in from field!')
            new_email = ''
            for e in parsed_emails:
                new_email += ', ' if new_email != '' else ''
                new_email += email.utils.formataddr(e)
            mail['mail_%s' % tpl] = new_email

        if 'expandGroupRecipients' in self.output_config and self.output_config[
                'expandGroupRecipients']:
            mail = self.expand_recipients(self, mail, self.output_config)

        if 'transports' not in self.output_config:
            raise NotConfiguredException(
                'No transports configured for sending email.')

        embedded_images = {}
        if 'images' in self.output_config['body']:
            embedded_images = self.embed_images(self.output_config)

        sent_successfully = False
        for transport in self.output_config['transports']:
            try:
                if transport['type'] == 'smtp':
                    sent_successfully = self.send_via_smtp(
                        transport, mail, embedded_images, self.output_config)
                    if sent_successfully:
                        break
                elif transport['type'] == 'sendgrid':
                    sent_successfully = self.send_via_sendgrid(
                        transport, mail, embedded_images, self.output_config)
                    if sent_successfully:
                        break
                else:
                    self.logger.exception(
                        'Unknown transport type %s in configuration.' %
                        transport['type'])
            except Exception:
                transport_sanitized = transport
                transport_sanitized.pop('apiKey', None)
                transport_sanitized.pop('user', None)
                transport_sanitized.pop('password', None)
                self.logger.exception('Error when attempting to use transport.',
                                      extra={
                                          'transport': transport_sanitized,
                                          'mail': mail
                                      })
        if not sent_successfully:
            self.logger.error(
                'Unable to send email, none of the transports worked.')
            raise AllTransportsFailedException(
                'Unable to send email, none of the transports worked.')
        else:
            self.logger.info('Message sent!',
                             extra={
                                 'from': mail['mail_from'],
                                 'to': mail['mail_to'],
                                 'subject': mail['mail_subject']
                             })