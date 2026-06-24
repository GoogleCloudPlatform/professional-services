/**
 * Copyright 2026 Google LLC
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

import axios from 'axios'

// TO RE-ENABLE OAUTH / FIREBASE TOKEN INJECTION:
// 1. Uncomment the Firebase auth import below:
// import { auth } from '../config/firebase'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api'

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Inject Firebase ID Token into every outgoing API request
apiClient.interceptors.request.use(async (config) => {
  // TO RE-ENABLE OAUTH / FIREBASE TOKEN INJECTION:
  // Uncomment the block below to fetch and inject the ID token.
  /*
  const currentUser = auth.currentUser;
  if (currentUser) {
    try {
      // Automatically fetches token from memory, or refreshes it from Firebase if expired
      const token = await currentUser.getIdToken();
      config.headers.Authorization = `Bearer ${token}`;
    } catch (error) {
      console.error('[apiClient] Failed to acquire ID token:', error);
    }
  }
  */
  return config;
}, (error) => {
  return Promise.reject(error);
})
