const cron = require('cron');
const date = require('date-fns');
const fs   = require('fs');
const ping = require('ping');
const yaml = require('js-yaml');

const db = require('./db')

class ConfigParseError extends Error {
    constructor(message) {
      super(message);
      this.name = "ConfigParseError";
    }
}
class NotImplementedError extends Error {
    constructor(message) {
      super(message);
      this.name = "NotImplementedError";
    }
}

function log(message){
    message =`${date.format(new Date(), 'MM/dd/yyyy H:m:s:SSS')}: ${message}`
    console.log(message)
}

async function icmpPing(host) {
    log(`icmpPing(${host}) called.`)
    return await ping.promise.probe(host);
}

// Read config from file
function readConfig(path) {
    var doc
    try {
        doc = yaml.load(fs.readFileSync(path, 'utf8'));
    } catch (e) {
        throw new ConfigParseError(`Failed to load config from ${path}: ${e}`)
    }
    if (!('hosts' in doc)) {
        throw new ConfigParseError(`Config at ${path} is missing key hosts`)
    }
    Object.entries(doc['hosts']).forEach(([host, check]) => {
        Object.entries(check).forEach(([checkName, checkContents]) => {
            if (checkName == "icmp") {
                // no problem.
            }
            else if (checkName == "tcp" || checkName == "udp") {
                Object.entries(checkContents).forEach(([_, port]) => {
                    // validate each specific port is numeric and < 65536 and < 0
                    if (typeof(port) != 'number' || port > 65536 || port < 1) {
                        throw new ConfigParseError(`Config at ${path} specifies invalid ${checkName} port number ${port} for host ${host}.`)
                    }
                })
            }
            else {
                throw new ConfigParseError(`Config at ${path} specifies unknown check type ${checkName} for host ${host}.`)
            }
        })
    })
    if ('interval' in doc) {
        if (typeof(doc['interval']) != 'number' || doc['interval'] < 1){
            throw new ConfigParseError(`Config at ${path} specifies unknown interval value ${doc['interval']}`)
        }
    } else {
        doc['interval'] = 10
    }
    if ('debug' in doc) {
        if (typeof(doc['debug']) != 'boolean') {
            throw new ConfigParseError(`Config at ${path} specifies unknown debug value ${doc['debug']}`)
        }
    } else {
        doc['debug'] = false
    }
    log(`Config looks good.`)
    return doc
}

// Create an interval job to gather metrics
function scheduleGatherMetrics(config, database){
    const job = new cron.CronJob(
        `* * * * * */${config['interval']}`, // cronTime
        async function() {
            await gatherMetrics(config, database)
        },
        null, // onComplete
        true, // start
        'America/Denver' // timeZone
    );
}

// Gather metrics and write to database
async function gatherMetrics(config, database){
    log(`gatherMetrics called`)
    results = {}
    Object.entries(config['hosts']).forEach(async ([host, check]) => {
        results[host] = {}
        Object.entries(check).forEach(async ([checkName, checkContents]) => {
            if (checkName == 'icmp') {
                results[host][checkName] = await icmpPing(host).then((pingResponse) => {
                    if (database) {
                        db.writeMetric(database, host, checkName, pingResponse.time, () => {log(`wrote ${checkName} result=${pingResponse.time} to database for ${host}.`)})
                    }
                })
            } else if (checkName in ['udp', 'tcp']){
                Object.entries(checkContents).forEach((_, port) => {
                    connectCheck(host, checkName, port)
                });
            }
        });
    });
}

function connectCheck(host, protocol, port) {
    log(`connectCheck is not yet implemented. It was called with host=${host}, protocol=${port}, port=${port}`)
}

module.exports.log = log
module.exports.icmpPing = icmpPing
module.exports.readConfig = readConfig
module.exports.scheduleGatherMetrics = scheduleGatherMetrics
