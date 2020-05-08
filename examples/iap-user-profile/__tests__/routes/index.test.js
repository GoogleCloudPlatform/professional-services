'use strict';

const {when} = require('jest-when');
const request = require('supertest');

const auth = require('../../auth');
jest.mock('../../auth');

const index = require('../../routes/index');
const express = require('express');

const OLD_ENV = process.env;

beforeEach(() => {
    jest.resetModules() // this is important - it clears the cache
    process.env = {...OLD_ENV};
    delete process.env.NODE_ENV;
});

afterEach(() => {
    process.env = OLD_ENV;
});

test('GET / with unknown user redirects to OAuth2 auth URL', (done) => {
    const userEmail = 'henry@domain.com';
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

    process.env.GAE_APPLICATION = "true";

    const app = express();
    app.use("/", index);

    request(app)
        .get('/')
        .set('X-Goog-Authenticated-User-Email', `accounts.google.com:${userEmail}`)
        .expect(302)
        .expect('Location', url, done);
});

