
// Copyright 2020 Google LLC
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//      http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

/**
 * @fileoverview Main entry point for a Node.js web application, used as a load
 * test target.
 */
const ConsoleLogger = require('./ConsoleLogger');
const appTracing = require('./tracing');

const tracer = appTracing.initTracing();
const express = require('express');

// Initialize Express
const app = express();
app.use(express.static('dist'));
app.use(express.json());

// For health checks
app.get('/healthcheck', (req, res) => {
  res.status(200).send('OK').end();
});

// Accept log and error messages
app.post('/log', (req, res) => {
  if ('logs' in req.body) {
    const { logs } = req.body;
    if (logs && logs instanceof Array) {
      ConsoleLogger.sync(logs);
    } else {
      sendError(`Body is empty or has wrong type: ${logs}`, res);
    }
  } else {
    sendError('Logs not found in body', res);
  }
  if ('errors' in req.body) {
    const { errors } = req.body;
    if (errors && errors instanceof Array) {
      ConsoleLogger.sync(errors);
    } else {
      sendError(`Body is empty or has wrong type: ${errors}`, res);
    }
  } else {
    sendError('Errors not found in body', res);
  }
  res.status(200).send('OK').end();
});

// Load test target
app.post('/data*', (req, res) => {
  if ('data' in req.body) {
    const { data } = req.body;
    if (data) {
      // Add a child span
      const currentSpan = tracer.getCurrentSpan();
      const span = tracer.startSpan('process-data', {
        parent: currentSpan
      });
      tracer.withSpan(span, () => {
        // Use some CPU
        for (let i = 0; i < 1000000; i += 1) {
          // Do nothing useful
          if (i % 1000000 === 0) {
            console.log(`app.post ${i}`);
          }
        }
        if ('name' in data && 'reqId' in data && 'tSent' in data) {
          console.log(`tSent: ${data.tSent}, name: ${data.name}, `
                      + `reqId: ${data.reqId}`);
          res.status(200).send(data).end();
        } else {
          const msg = 'Payload does not include expected fields';
          console.log(msg);
          sendError(msg, res);
        }
        span.end();
      });
    } else {
      const msg = 'Data is empty';
      console.log(msg);
      sendError(msg, res);
    }
  } else {
    const msg = 'Data is empty';
    sendError(msg, res);
  }
});

/**
 * Sends an error back to the client
 * @param {string} msg - error message to send
 * @param {Response} res - EXpress HTTP response object
 */
function sendError(msg, res) {
  console.log(msg);
  res.status(500).send(msg).end();
}

// Start the server
const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(`App listening on port ${PORT}`);
});
