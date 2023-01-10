/**
 * Copyright 2022 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

const express = require('express');
const app = express();
const { Storage } = require('@google-cloud/storage');

const PORT = 3000;
const PROJECT_ID = process.env.PROJECT_ID;

const storage = new Storage();


app.use(express.json());
app.set('json spaces', 2)

app.get('/buckets', async (req, res) => {
    try {
        const [buckets] = await storage.getBuckets();
        res.json(buckets.map(bucket => bucket.name));
    } catch (error) {
        res.status(500).json({
            message: `An error occurred trying to fetch the buckets in project: ${error}`
        });
    }
});

app.get('/buckets/:name', async (req, res) => {
    const name = req.params.name;
    try {
        const [files] = await storage.bucket(name).getFiles();
        res.json(files.map(file => file.name));
    } catch (error) {
        res.status(500).json({
            message: `An error occurred fetch the files in ${name} bucket: ${error}`
        });
    }
});

app.post('/buckets', async (req, res) => {
    const name = req.body.name;
    try {
        const [bucket] = await storage.createBucket(name);
        res.status(201).json({
            "name": bucket.name
        });
    } catch (error) {
        res.status(500).json({
            message: `An error occurred trying to create ${name} bucket: ${error}`
        });
    }
});

app.delete('/buckets/:name', async (req, res) => {
    const name = req.params.name;
    try {
        await storage.bucket(name).delete();
        res.send()
    } catch (error) {
        res.status(500).json({
            message: `An error occurred trying to delete ${name} bucket: ${error}`
        });
    }
});

app.listen(PORT, () => {
    console.log(`App listening on port ${PORT}`)
})