'use strict';

const winston = require('winston');
const { LoggingWinston } = require('@google-cloud/logging-winston');

const transports = [];

if (process.env.GAE_APPLICATION) {
    transports.push(new LoggingWinston());
} else {
    transports.push(new winston.transports.Console({
        level: 'debug',
        format: winston.format.combine(
            winston.format.colorize(),
            winston.format.simple(),
        ),
    }));
}

const logger = winston.createLogger({
    level: 'info',
    format: winston.format.json(),
    transports: transports,
});

exports.logger = logger;
