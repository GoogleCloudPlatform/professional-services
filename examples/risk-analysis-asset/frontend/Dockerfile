# Copyright 2020 Google LLC
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#      http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.


# Use the official Node.js image as a base
FROM node:18-alpine

# Set the working directory inside the container
WORKDIR /app

# Copy package.json and package-lock.json (if you have it)
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy the frontend code to the container
COPY . .

# Build the React app (adjust to your build command if different)
RUN npm run build

# Install concurrently to run multiple processes
# RUN npm install -g concurrently

# Expose the port your frontend application will run on (usually 3000)
EXPOSE 3000
EXPOSE 3001

# Start the React app (adjust to your start command if different)
CMD ["npm", "start"] 
