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
