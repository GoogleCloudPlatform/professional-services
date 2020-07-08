/*
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

'use strict';

const { logger } = require('../logging');

const { google } = require('googleapis');
const { SecretManagerServiceClient } = require('@google-cloud/secret-manager');

async function getOAuth2Client() {
    const projectId = process.env.GOOGLE_CLOUD_PROJECT;
    const regionId = 'an'; // GAE region ID
    const redirectUrl = `https://${projectId}.${regionId}.r.appspot.com/auth-callback`;

    const client = new SecretManagerServiceClient();
    const secretName = `projects/${projectId}/secrets/iap-user-profile-svc-oauth2-client/versions/latest`;

    logger.info(`Retrieving secret '${secretName}' from Secret Manager...`);

    const [accessResponse] = await client.accessSecretVersion({
        name: secretName
    });
    const responsePayload = accessResponse.payload.data.toString();

    const secretData = JSON.parse(responsePayload);
    const clientId = secretData.web.client_id;
    const clientSecret = secretData.web.client_secret;

    return new google.auth.OAuth2(clientId, clientSecret, redirectUrl);
}

module.exports = {
    getOAuth2Client: getOAuth2Client
}
