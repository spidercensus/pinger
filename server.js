const express = require('express');
const app = express();
const utils = require('./utils')

// Define routes.
app.get('/', (req, res) => {
  res.send('OK');
});

app.get('/metrics', (req, res) => {
  utils.log(`${req.url} requested from ${req.ip}`)
  res.send(`Hello ${req.ip}`);
  // retrieve metrics and display them here.
});

app.get('/ping/:host', (req, res) => {
    utils.log(`${req.url} requested from ${req.ip}`)
    if ('host' in req.params) {
        result = utils.icmpPing(req.params['host'])
        msg = `No response from ${req.params['host']}`
        if (result) {
            msg = `Received response from ${req.params['host']}`
        }
        res.send(msg)
    }
    else {
        res.send("Missing host parameter.")
    }
});

// Listen to the App Engine-specified port, or 8080 otherwise
const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}...`);
});
