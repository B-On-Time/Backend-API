const bcrypt = require('bcryptjs');

bcrypt.hash( "123", 10 ).then( async (hash) => {
    console.log(hash)
})