const date = require('date-fns')
const fs   = require('fs');
var net = require('net');
const ping = require('ping');
const yaml = require('js-yaml');

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
    let resp = await ping.promise.probe(host);
    return resp
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
        return {}
    }
    Object.entries(doc['hosts']).forEach(([host, check]) => {
        Object.entries(check).forEach(([checkName, checkContents]) => {
            if ('interval' in checkContents) {
                if (typeof(checkContents['interval']) != 'number' || checkContents['interval'] < 1) {
                    throw new ConfigParseError(`Config at ${path} specifies invalid timeout for ${check} on host ${host}.`)
                }
            }
            if (checkName == "icmp") {
                // no problem.
            }
            else if (checkName == "tcp") {
                Object.entries(checkContents).forEach(([_, port]) => {
                // validate each specific port is numeric and < 65536 and < 0
                if (typeof(port) != 'number' || port > 65536 || port < 1) {
                    throw new ConfigParseError(`Config at ${path} specifies invalid TCP port number ${port} for host ${host}.`)
                }
            })
            }
            else {
                throw new ConfigParseError(`Config at ${path} specifies unknown check type ${checkName} for host ${host}.`)
            }
        })
    })
    log(`Config looks good.`)
    return doc
}

function tcpConnectCheck(host, port) {
    throw new NotImplementedError(`tcpConnectCheck is not yet implemented. It was called with host=${host}, port=${port}`)
}

module.exports.log = log
module.exports.icmpPing = icmpPing
module.exports.readConfig = readConfig
module.exports.tcpConnectCheck = tcpConnectCheck
