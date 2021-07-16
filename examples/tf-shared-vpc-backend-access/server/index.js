// Copyright 2021 Google LLC
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//     https://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

// [START cloudrun_helloworld_service]
// [START run_helloworld_service]
const express = require('express');
const app = express();
const fetch = require('node-fetch');

// the prefix of this IP address is used in main.tf in the ip_prefix variable and then in networking.tf
// so if you want to change it, please change it there accordingly
const REMOTE_SERVER = "http://192.168.1.6:8000";

const getExternalIp = async () => {
  try {
    const response = await fetch(REMOTE_SERVER, {});
    const ip = await response.text();
    return ip;
  } catch (err) {
    console.log('Error while talking to metadata server, assuming localhost', err);
    return 'timeout';
  }
};

app.get('/', (req, res) => {
  const name = process.env.NAME || 'World';
  res.send(`Hello ${name}!`);
});

app.get('/ping', async (req, res) => {
  const txt = await getExternalIp();

  res.send(`Ping ${txt}!`);
});


const port = process.env.PORT || 8080;
app.listen(port, () => {
  console.log(`helloworld: listening on port ${port}`);
});
// [END run_helloworld_service]
// [END cloudrun_helloworld_service]

// Exports for testing purposes.
module.exports = app;
