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

const {when} = require('jest-when');
const {SecretManagerServiceClient} = require('@google-cloud/secret-manager');
jest.mock('@google-cloud/secret-manager');

const auth = require('../../auth');

const OLD_ENV = process.env;

beforeEach(() => {
    jest.resetModules();

    process.env = { ...OLD_ENV };
    delete process.env.NODE_ENV;
});

afterEach(() => {
    process.env = OLD_ENV;
});

test('getOAuth2Client is initialized properly', async () => {
    const projectId = 'gcp-project-id';
    const clientId = 'client-id';
    const clientSecret = 'client-secret';

    process.env.GOOGLE_CLOUD_PROJECT = projectId;

    const expectedSecretName = `projects/${projectId}/secrets/iap-user-profile-svc-oauth2-client/versions/latest`;
    const mockAccessSecretVersionFn = jest.fn();
    when(mockAccessSecretVersionFn)
        .expectCalledWith({name: expectedSecretName})
        .mockReturnValueOnce([{payload: {data: `{"web": {"client_id": "${clientId}", "client_secret": "${clientSecret}"}}`}}]);

    SecretManagerServiceClient.mockImplementation(() => ({
        accessSecretVersion: mockAccessSecretVersionFn
    }));

    const oauth2Client = await auth.getOAuth2Client();

    expect(oauth2Client._clientId).toBe(clientId);
    expect(oauth2Client._clientSecret).toBe(clientSecret);
    expect(oauth2Client.redirectUri).toBe(`https://${projectId}.an.r.appspot.com/auth-callback`);
});
