/*
 * Copyright 2018 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     https://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

const express = require('express');
const { GoogleAuth } = require('google-auth-library');
const cors = require('cors');

const app = express();
app.use(cors({origin: '*'}));
  
const backendURL = process.env.REACT_APP_ENV === 'local'
? 'http://127.0.0.1:5000'  
: process.env.REACT_APP_BACKEND_SERVICE_URL;

app.get('/get-id-token', async (req, res) => {
  try {
    const auth = new GoogleAuth();
    const client = await auth.getIdTokenClient(backendURL);
    const headers = await client.getRequestHeaders();
    const idToken = headers['Authorization'].replace('Bearer ', ''); // Extract the token
    res.json({ idToken });
  } catch (error) {
    console.error('Error fetching ID token:', error);
    res.status(500).json({ error: 'Error fetching ID token' });
  }
});

const port = 3001;
app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});