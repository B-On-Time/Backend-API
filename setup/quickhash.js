// const bcrypt = require('bcryptjs');

// bcrypt.hash( "Cocoa@2020", 10 ).then( async (hash) => {
//     console.log(hash)
// })


var d = new Date();
var nowPGTimeStamp = d.getFullYear() + '-' + pad( (d.getMonth()+1), 2 ) + '-' + pad( (d.getDate()), 2) + ' ' +  pad( (d.getHours()), 2) + ':' +  pad( (d.getMinutes()), 2) + ':' +  pad( (d.getSeconds()), 2);

function pad(n, width, z) {
    z = z || '0';
    n = n + '';
    return n.length >= width ? n : new Array(width - n.length + 1).join(z) + n;
}