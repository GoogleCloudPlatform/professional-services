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

const userService = require('../../services/user-service');

test('user is saved and can be found', async () => {
    const userEmail = 'henry@domain.com';
    const user = { email: userEmail, displayName: 'Henry' };

    await userService.saveUser(user);

    expect(await userService.getUserByEmail(userEmail)).toBe(user);
});

test('user not found returns null', async () => {
   expect(await userService.getUserByEmail('unknown@domain.com')).toBeNull();
});
