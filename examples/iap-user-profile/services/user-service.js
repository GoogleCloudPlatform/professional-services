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

/* In-memory dictionary to store users with email as key.
   NOTE: This in-memory storage is used only for example purpose.
   For real production use case, you should use external persistent storage, such as cache or database. */
const users = {}

async function getUserByEmail(email) {
    let user;

    logger.info(`Finding user by email ${email}`);

    if (users[email]) {
        user = users[email];

        logger.info(`Found user: ${JSON.stringify(user)}`);
    } else {
        user = null;
    }

    return user;
}

async function saveUser(user) {
    logger.info(`Saving user: ${JSON.stringify(user)}`);

    users[user.email] = user;
}

module.exports = {
    getUserByEmail,
    saveUser
}
