// Copyright 2026 Google LLC
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

import express from 'express';
import path from 'path';
import { apiMiddleware } from './middleware';

const app = express();
const port = process.env.PORT || 8080;

// Mount API endpoints
app.use(apiMiddleware);

// Serve client build folder
const distPath = path.resolve(process.cwd(), 'dist');
app.use(express.static(distPath));

// Fallback all other GET requests to index.html for React SPA Router
app.get('*', (_req, res) => {
  res.sendFile(path.join(distPath, 'index.html'));
});

app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});
