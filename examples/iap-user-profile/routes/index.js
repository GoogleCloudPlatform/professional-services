const express = require('express');
const router = express.Router();

/* Users dictionary with email as key */
const usersInfo = {}

function resolveUserEmail(req) {
  let userEmail;

  if (process.env.GAE_APPLICATION) {
    userEmail = req.header('X-Goog-Authenticated-User-Email').substring("accounts.google.com".length + 1);
  } else {
    userEmail = 'henry@email.com';
  }

  return userEmail;
}

function getUserInfo(req) {
  let userInfo;

  const email = resolveUserEmail(req);

  if (usersInfo[email]) {
    userInfo = usersInfo[email];
  } else {
    userInfo = {email: email, fullName: 'Henry Suryawirawan'};
  }

  return userInfo;
}

/* GET home page. */
router.get('/', function(req, res, next) {
  let userInfo = getUserInfo(req);

  res.render('index', userInfo);
});

module.exports = router;
