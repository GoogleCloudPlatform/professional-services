var express = require('express');
var router = express.Router();

const { logger } = require('../logging');

/* GET users listing. */
router.get('/me', function(req, res, next) {
  const userEmail = req.header('X-Goog-Authenticated-User-Email');

  logger.info(`User email: ${userEmail}`);

  res.json({email: userEmail, fullName: ""});
});

module.exports = router;
