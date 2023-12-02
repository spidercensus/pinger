const cron = require('cron');

const dgram = require('dgram')
const fs   = require('fs');
const net = require('net')
const ping = require('ping');
const yaml = require('js-yaml');

const common = require('./common')
const db = require('./db')

class ConfigParseError extends Error {
    constructor(message) {
      super(message);
      this.name = "ConfigParseError";
    }
}

async function icmpPing(host) {
    return await ping.promise.probe(host);
}

function isValidPort(port) {
    if (typeof(port) != 'number' || port < 1 || port > 65535) {
        return false
    }
    return true
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
                    if (!isValidPort(port)) {
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

    if ('listenPort' in doc) {
        if (!isValidPort(doc['listenPort'])) {
            throw new ConfigParseError(`Config at ${path} specifies invalid listenPort number ${doc['listenPort']}}.`)
        }
    } else {
        doc['listenPort'] = 8080
    }
    common.log(`Config looks good.`)
    return doc
}

// Create an interval job to gather metrics
function scheduleGatherMetrics(config, database){
    common.log(`gatherMetrics will run every ${config['interval']} seconds`)
    const job = new cron.CronJob(
        `*/${config['interval']} * * * * *`, // cronTime
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
    Object.entries(config['hosts']).forEach(async ([host, check]) => {
        Object.entries(check).forEach(async ([checkName, checkContents]) => {
            if (checkName == 'icmp') {
                icmpPing(host).then((pingResponse) => {
                    if (config['debug']) {common.log(`icmpPing(${host}) complete`)};
                    if (database) {
                        db.writeMetric(database, host, checkName, pingResponse.time)
                    }
                })
            } else if (checkName == 'tcp' || checkName == 'udp'){
                Object.entries(checkContents).forEach(async ([_, port]) => {
                    connectCheck(host, checkName, port).then((message) =>{
                        if (config['debug']){common.log(message);}
                        if (database){
                            db.writeMetric(database, host, `${checkName}_${port}`, 1)
                        }
                    }).catch((message) => {
                        common.log(message)
                        if (database){
                            db.writeMetric(database, host, `${checkName}_${port}`, 0)
                        }
                    })
                });
            }
        });
    });
}

async function connectCheck(host, protocol, port) {
    return new Promise((resolve, reject) => {
        if (protocol == 'udp'){
            reject("UDP support not yet implemented.")
        }
        try {
            var client = new net.Socket();
            client.on('error', (error) => {
                reject(`Failed to connect: host=${host}, protocol=${protocol}, port=${port}. ${error}`)
            });
            client.on('timeout', (error) => {
                reject(`Connection time-out: host=${host}, protocol=${protocol}, port=${port}. ${error}`)
            });
            client.connect(port, host, () => {
                resolve(`Connected to host=${host}, protocol=${protocol}, port=${port}`)
            });
        } catch (error) {
            reject(`Failed to connect to host=${host}, protocol=${protocol}, port=${port}. ${error}`)
        }
    });
}

module.exports.icmpPing = icmpPing
module.exports.readConfig = readConfig
module.exports.scheduleGatherMetrics = scheduleGatherMetrics
