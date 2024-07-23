const express = require('express');
const { exec } = require('child_process');

const app = express();
const port = 3000;

app.get('/execute-gcloud-command', (req, res) => {
    // Execute the gcloud command
    exec('gcloud auth application-default login', (error, stdout, stderr) => {
        if (error) {
            console.error('Error:', error);
            res.status(500).send('Error executing gcloud command');
            return;
        }
        console.log('Output:', stdout);
        res.send(stdout); // Send the output back to the client
    });
});

app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}/execute-gcloud-command`);
});
