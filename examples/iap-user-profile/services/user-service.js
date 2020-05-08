'use strict';

const { logger } = require('../logging');

/* In-memory dictionary to store users with email as key */
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
