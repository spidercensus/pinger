const date = require('date-fns');

function log(message){
    message =`${date.format(new Date(), 'MM/dd/yyyy H:m:s:SSS')}: ${message}`
    console.log(message)
}

module.exports.log = log