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
