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
        var result = utils.icmpPing(req.params['host'])
        var responseBody = {
            "output": undefined
        }
        result.then((pingResponse) => {
            responseBody["alive"] = pingResponse.alive
            responseBody["output"] = pingResponse.output
            res.json(responseBody)
        }).catch((error) => {
            var msg = `Failed to run ping of ${req.params['host']}: ${error}`
            responseBody["error"] = msg
            res.json(responseBody)
            console.log(msg)
        });
    }
    else {
        res.json({"error": "Missing host parameter."})
        // res.send("Missing host parameter.")
    }
});

// Listen to the App Engine-specified port, or 8080 otherwise
const PORT = process.env.PORT || 8080;

// Load config from the specified config file path or just use config.yaml.
const configPath = process.env.CONFIG || 'config.yaml'
const config = utils.readConfig(configPath)


// @TODO Instantiate an in-memory datastore

// @TODO Use the config to instantiate a couple of workers.

app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}...`);
});
