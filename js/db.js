const level = require('classic-level')

class DatabaseError extends Error {
  constructor (message) {
    super(message)
    this.name = 'ConfigParseError'
  }
}

function getDatabase (path) {
  path = path || './pinger-db'
  console.log(`Initializing Level database at ${path}`)
  return new level.ClassicLevel(path, { valueEncoding: 'json' })
}

function dbKeyForValue (host, check) {
  // tcp443{host="myserver"} 0.951
  const key = `${check}{host="${host}"}`
  return key
}

async function writeMetric (db, host, check, value, callback) {
  if (typeof (value) !== 'number') {
    throw new DatabaseError(`Tried to write non-number value ${value} to database.`)
  }
  return await db.put(dbKeyForValue(host, check), value, callback)
}

async function getMetric (db, host, check, callback) {
  const key = dbKeyForValue(host, check)
  return await db.get(key, callback)
}

async function dumpMetrics (db, callback) {
  const values = {}
  for await (const [key, value] of db.iterator()) {
    values[key] = value
  }
  callback(values)
}

module.exports.dumpMetrics = dumpMetrics
module.exports.getDatabase = getDatabase
module.exports.getMetric = getMetric
module.exports.writeMetric = writeMetric
