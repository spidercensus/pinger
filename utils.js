const date = require('date-fns')
// const logger = require('npmlog');
const ping = require('ping');

function log(message){
    message =`${date.format(new Date(), 'MM/dd/yyyy H:m:s:SSS')}: ${message}`
    console.log(message)
}

function icmpPing(host) {
    return ping.sys.probe(host, function(isAlive){
        if (isAlive) {
            log(`${host} responded to ping.`)
        } else {
            log(`${host} did not respond to ping.`)
        }
        return isAlive;
    });
}



module.exports.log = log
module.exports.icmpPing = icmpPing