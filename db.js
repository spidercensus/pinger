const level = require('classic-level');

function getDatabase(path) {
    path = path || "./pinger-db";
    console.log(`Initializing Level database at ${path}`)
    return new level.ClassicLevel(path, { valueEncoding: 'json' });
}

function dbKeyForValue(host, check, check_port) {
    const key = `${host}/${check}/${check_port}`;
    console.log(`dbKeyForValue: ${key}`)
    return key
}

async function writeMetric(db, host, check, check_port, value, callback) {
    const key = dbKeyForValue(host, check, check_port);
    let result = await db.put(key, value, callback);
}

async function getMetric(db, host, check, check_port, callback) {
    const key = dbKeyForValue(host, check, check_port);
    let result = await db.get(key, callback);
}

async function dumpMetrics(db, callback) {
    let values = {}
    for await (const [key, value] of db.iterator()) {
        values[key = value]
    }
    console.log(`dumpMetrics found: ${values}`)
    callback(values)
}
