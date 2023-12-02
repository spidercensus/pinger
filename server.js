const express = require('express');
const app = express();

const db = require('./db')
const utils = require('./utils')

// Instantiate an in-memory datastore
const database = db.getDatabase()

// Define routes.
app.get('/', (req, res) => {
    res.send('OK');
});

app.get('/metrics.json', (req, res) => {
    utils.log(`${req.url} requested from ${req.ip}`)
    db.dumpMetrics(database, (results) => {
        res.json(results)
    })
});

app.get('/metrics', (req, res) => {
    utils.log(`${req.url} requested from ${req.ip}`)
    db.dumpMetrics(database, (results) => {
        bodyArray = Array(results.length)
        idx = 0
        Object.entries(results).forEach(([key, value]) => {
            bodyArray[idx] = `${key} ${value}`;
            idx++;
        })

        res.send(bodyArray.join("\n"))
    })
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


// Schedule gathering of metrics.
utils.scheduleGatherMetrics(config, database)

app.listen(PORT, () => {
  utils.log(`Server listening on port ${PORT}...`);
});
