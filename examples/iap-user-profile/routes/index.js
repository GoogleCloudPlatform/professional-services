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

const express = require('express');
const router = express.Router();
const { google } = require('googleapis');

const auth = require('../auth');
const userService = require('../services/user-service');

async function promptOAuth(res, userEmail) {
    const scopes = ['https://www.googleapis.com/auth/userinfo.profile'];
    const oauth2Client = await auth.getOAuth2Client();
    const url = oauth2Client.generateAuthUrl({
        access_type: 'online',
        scope: scopes,
        login_hint: userEmail,
    });

    res.redirect(url);
}

function resolveUserEmail(req) {
    let userEmail;

    if (process.env.GAE_APPLICATION) {
        userEmail = req.header('X-Goog-Authenticated-User-Email').substring("accounts.google.com".length + 1);

        logger.info(`IAP user email: ${userEmail}`);
    } else {
        throw new Error("Expected user email to be found from IAP header");
    }

    return userEmail;
}

router.get('/', async function (req, res) {
    let userEmail = resolveUserEmail(req);
    let user = await userService.getUserByEmail(userEmail);

    if (user == null) {
        logger.info(`User info not found, redirecting to OAuth login page`);

        await promptOAuth(res, userEmail);
        return;
    }

    res.render('index', user);
});

router.get('/auth-callback', async function (req, res) {
    const userEmail = resolveUserEmail(req);
    const code = req.query.code;

    const oauth2Client = await auth.getOAuth2Client();
    const {tokens} = await oauth2Client.getToken(code);
    oauth2Client.setCredentials(tokens);

    const peopleApi = google.people({
        version: 'v1',
        auth: oauth2Client,
    });
    const peopleResponse = await peopleApi.people.get({
        resourceName: 'people/me',
        personFields: 'emailAddresses,names,photos',
    });
    const name = peopleResponse.data.names[0];
    const photo = peopleResponse.data.photos[0];

    const user = {
        email: userEmail,
        displayName: name.displayName,
        photoUrl: photo.url
    };

    logger.info(`Retrieved my user profile from People API: ${JSON.stringify(user)}`);

    await userService.saveUser(user);

    res.redirect('/');
});

module.exports = router;
