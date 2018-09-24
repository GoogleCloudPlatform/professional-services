# Copyright 2017 Google Inc.
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#            http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.

import logging
import urllib
import uuid

from google.cloud import datastore
import httplib2
from oauth2client import client
from webapp2_extras import securecookie
import webapp2

from dns_sync import api
from dns_sync import config


COOKIE_SIGNER = securecookie.SecureCookieSerializer(config.get_project_id())
COOKIE_MAX_AGE_SECS = 60*60


class UserOauth2Token(datastore.Entity):
    """Stores user access tokens in the datastore.

    These tokens are deleted when users signs out or a 401 (invalid auth) is
    returned from the API. The Key is a random string which is also the cookie
    value.
    """
    KIND = 'UserOauth2Token'

    def __init__(self, entity_id, credentials, is_admin=False):
        super(UserOauth2Token, self).__init__(
            key=api.CLIENTS.datastore.key(UserOauth2Token.KIND, entity_id),
            exclude_from_indexes=['credentials', 'is_admin'])
        self.update({'credentials': credentials, 'is_admin': is_admin})

    @classmethod
    def get_by_id(cls, entity_id):
        """Get the token entity for the provided id.

        Args:
            entity_id: String id of the entity.

        Returns:
            UserOauth2Token instance, or None if not found.
        """
        if not entity_id:
            return None
        entity = api.CLIENTS.datastore.get(
            api.CLIENTS.datastore.key(UserOauth2Token.KIND, entity_id))
        if entity:
            return UserOauth2Token(entity_id, entity['credentials'],
                                   entity['is_admin'])
        else:
            return None

    def put(self):
        """Save state in datastore."""
        api.CLIENTS.datastore.put(self)

    def delete(self):
        """Delete from datastore."""
        api.CLIENTS.datastore.delete(self.key)


class AdminRequestHandler(webapp2.RequestHandler):
    """Ensure requesting user is an application Admin.

    Rejects the request unless the user has necessary admin rights to proceed.
    This is similar to the "login: admin" handler functionlity of GAE Standard.
    """
    SKIP_AUTHENTICATION = False

    def dispatch(self):
        """Proceed with request if valid credentials are provided.

        - If no credentials are provided, redirect to login.
        - If invalid credentials are provided, redirect to logout.
        - If valid credentials are provided. Proceed.
        - Unless skip_authentication is true (which is just for unit tests)
        - then just always proceed.

        Returns:
            A webapp2 response object that redirecs the user or whatever the
            subclass returns the 'get/put' method.
        """

        if AdminRequestHandler.SKIP_AUTHENTICATION:
            logging.debug('skipping authentication')
            return super(AdminRequestHandler, self).dispatch()
        token_id_cookie = self.request.cookies.get('user_id', None)
        token_id = COOKIE_SIGNER.deserialize('user_id', token_id_cookie,
                                             COOKIE_MAX_AGE_SECS)

        token = UserOauth2Token.get_by_id(token_id)
        credentials = None
        if token:
            credentials = client.OAuth2Credentials.from_json(
                token['credentials'])
            if credentials.access_token_expired:
                logging.debug('access token expired %s',
                              credentials.token_expiry)
                token.delete()
                credentials = None
        if not credentials:
            logging.debug('no valid credentials')
            state = urllib.quote(self.request.path_qs, safe='')
            redirect_uri = self.request.host_url + '/auth?state=' + state
            return self.redirect(redirect_uri)
        else:
            # Verify the user has admin access.
            if token.get('is_admin', False):
                logging.debug('is admin is true, proceeding')
                return super(AdminRequestHandler, self).dispatch()
            else:
                logging.debug('not an admin, logout')
                return self.redirect('/logout')


class Logout(webapp2.RequestHandler):
    """Delete the user's refresh token and logout the user."""

    def get(self):
        """Clear the UserOauth2RefreshToken and redirect to logout."""
        token_id = self.request.cookies.get('user_id', None)
        if token_id:
            self.response.delete_cookie('user_id')
        token = UserOauth2Token.get_by_id(token_id)
        if token:
            token.delete()
        state = self.request.get('state')
        if not state:
            state = '/static/index.html'
        return self.redirect(state)


class Oauth2Callback(webapp2.RequestHandler):
    """Handles the Oauth2 flow.

    Called when Google redirects back to the app with oauth code,
    or when user is not logged in (then redirect to google).
    """

    def is_admin(self, credentials):
        """Check if user has appengine.admin role.

        Calls iam.projects.testIamPermissions with
        appengine.applications.update to determine if the current logged in
        user is an application admin.

        Args:
            credentials: the user's access token.

        Returns:
            True if user is an admin, False otherwise.
        """
        admin_permission = 'appengine.applications.update'
        body = {'permissions': admin_permission}
        http = credentials.authorize(httplib2.Http())
        response = api.CLIENTS.iam.projects().testIamPermissions(
            resource=config.get_project_id(), body=body).execute(http=http)
        return admin_permission in response.get('permissions', [])

    def dispatch(self):
        """Redirect to Google account login to the "state" parameter.

        This handler is called in two cases:

        1. When a login needs to be performed because credentials were invalid
        or don't exist. This will redirect to Google account page as part of
        the ouath2 three leggged flow.

        2. After successful login, Google redirects to this handler (the oauth2
        callback url). Exchange the 'code' for an access token and then
        redirect to the final destination which is stored in the 'state'
        request parameter.

        This process is described here:
        https://developers.google.com/identity/protocols/OAuth2WebServer

        Returns:
            webapp2.Response object redirecting the user to either Google login
        or to the 'state' request parameter with proper credentials.
        """
        logging.debug('dispatch')
        redirect_uri = self.request.host_url + '/auth'
        flow = client.flow_from_clientsecrets(
            'client_secrets.json',
            redirect_uri=redirect_uri,
            scope=[
                'https://www.googleapis.com/auth/cloud-platform',
                'https://www.googleapis.com/auth/userinfo.email'
            ])
        flow.params['prompt'] = 'select_account'
        flow.params['access_type'] = 'online'
        auth_code = self.request.get('code')
        # No code means user was not logged in, redirect to Google.
        if not auth_code:
            auth_uri = flow.step1_get_authorize_url(
                state=self.request.get('state'))
            return self.redirect(str(auth_uri))

        # If we have a code, user came from Google after login.
        auth_code = self.request.get('code')
        credentials = flow.step2_exchange(auth_code)
        user_id = str(uuid.uuid4())
        token = UserOauth2Token(user_id, credentials.to_json())
        token['is_admin'] = self.is_admin(credentials)
        logging.debug('Oauth2Callback is_admin=%s', token['is_admin'])
        token.put()

        token_id_cookie = COOKIE_SIGNER.serialize('user_id', user_id)

        # setting secure=True requires HTTPS which can make local development
        # impossible when using webservers that don't support HTTPS.
        self.response.set_cookie('user_id', token_id_cookie,
                                 max_age=COOKIE_MAX_AGE_SECS,
                                 secure=True, httponly=True,
                                 overwrite=True)

        # Send the user to where they were going.
        return self.redirect(self.request.get('state'))
