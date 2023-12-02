const level = require('classic-level');

function getDatabase(path) {
    path = path || "./pinger-db";
    console.log(`Initializing Level database at ${path}`)
    return new level.ClassicLevel(path, { valueEncoding: 'json' });
}

function dbKeyForValue(host, check) {
    // tcp443{host="myserver"} 0.951
    const key = `${check}{host=${host}}`
    console.log(`dbKeyForValue: ${key}`)
    return key
}

async function writeMetric(db, host, check, value, callback) {
    return await db.put(dbKeyForValue(host, check), value, callback);
}

async function getMetric(db, host, check, callback) {
    const key = dbKeyForValue(host, check);
    return await db.get(key, callback);
}

async function dumpMetrics(db, callback) {
    let values = {}
    for await (const [key, value] of db.iterator()) {
        values[key] = value
    }
    callback(values)
}

module.exports.dumpMetrics = dumpMetrics
module.exports.getDatabase = getDatabase
module.exports.getMetric = getMetric
module.exports.writeMetric = writeMetric
