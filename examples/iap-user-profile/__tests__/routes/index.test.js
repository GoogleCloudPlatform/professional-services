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

const path = require('path');
const mustacheExpress = require('mustache-express');

const {when} = require('jest-when');
const request = require('supertest');

const { google } = require('googleapis');
jest.mock('googleapis');

const auth = require('../../auth');
jest.mock('../../auth');

const userService = require('../../services/user-service');

const index = require('../../routes/index');
const express = require('express');

const OLD_ENV = process.env;
let app = express();

app.set('views', path.join(__dirname, '../../views'));
app.engine('mustache', mustacheExpress());
app.set('view engine', 'mustache');

app.use("/", index);

beforeEach(() => {
    jest.resetModules();

    process.env = {...OLD_ENV};
    delete process.env.NODE_ENV;

    process.env.GAE_APPLICATION = "true";
});

afterEach(() => {
    process.env = OLD_ENV;
});

describe('GET /', () => {
    test('unknown user redirects to OAuth2 auth URL', (done) => {
        const userEmail = 'unknown@domain.com';
        const url = 'https://oauth2-url'

        const generateAuthUrlFn = jest.fn();
        when(generateAuthUrlFn)
            .expectCalledWith({
                access_type: 'online',
                scope: ['https://www.googleapis.com/auth/userinfo.profile'],
                login_hint: userEmail,
            })
            .mockReturnValueOnce(url);

        auth.getOAuth2Client.mockResolvedValue({
            generateAuthUrl: generateAuthUrlFn
        });

        request(app)
            .get('/')
            .set('X-Goog-Authenticated-User-Email', `accounts.google.com:${userEmail}`)
            .expect(302)
            .expect('Location', url, done);
    });

    test('known user renders the index', (done) => {
        const henry = {email: 'henry@domain.com', displayName: 'Henry'};

        userService.saveUser(henry);

        request(app)
            .get('/')
            .set('X-Goog-Authenticated-User-Email', `accounts.google.com:${henry.email}`)
            .expect(200)
            .expect('Content-Type', /text\/html/)
            .end(function(err, res) {
                expect(res.text).toContain(henry.displayName);
                expect(res.text).toContain(henry.email);

                if (err) return done(err);
                done();
            });
    });
});

describe('/auth-callback', () => {
    test('user info retrieved and renders the index', async (done) => {
        const email = 'henry-callback@domain.com';
        const henryCallbackUser = {email: email, displayName: 'Henry Callback', photoUrl: 'https://henry-callback-photo-url'};
        const authCode = 'auth-code';
        const tokens = {access_token: 'token'};

        const getTokenFn = jest.fn();
        when(getTokenFn)
            .expectCalledWith(authCode)
            .mockReturnValue(tokens);

        const setCredentialsFn = jest.fn();
        when(setCredentialsFn)
            .expectCalledWith(tokens);

        const mockOAuth2Client = {
            getToken: getTokenFn,
            setCredentials: setCredentialsFn
        };
        auth.getOAuth2Client.mockResolvedValue(mockOAuth2Client);

        const peopleResponse = {
            data: {
                names: [{displayName: henryCallbackUser.displayName}],
                photos: [{url: henryCallbackUser.photoUrl}]
            }
        };

        const mockPeopleGetFn = jest.fn();
        when(mockPeopleGetFn)
            .expectCalledWith({
                resourceName: 'people/me',
                personFields: 'emailAddresses,names,photos',
            })
            .mockResolvedValue(peopleResponse);

        const mockPeopleApi = {
            people: {
                get: mockPeopleGetFn
            }
        }

        when(google.people)
            .calledWith({
                version: 'v1',
                auth: mockOAuth2Client
            })
            .mockReturnValue(mockPeopleApi);

        request(app)
            .get(`/auth-callback?code=${authCode}`)
            .set('X-Goog-Authenticated-User-Email', `accounts.google.com:${email}`)
            .expect(302)
            .expect('Location', '/')
            .end(async function(err, res) {
                const actualUser = await userService.getUserByEmail(email);
                expect(actualUser).toEqual(henryCallbackUser);

                if (err) return done(err);
                done();
            });
    });
});