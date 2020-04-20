const fs = require('fs');
const express = require('express');
var router = express.Router();
const { Pool } = require('pg');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const bodyParser = require('body-parser');
const uuidv4 = require('uuid/v4');
const _ = require('underscore');
var cors = require('cors');
var cookieParser = require('cookie-parser');
const validator = require('validator');
// Libraries
const log = require('../libraries/logging.js');
const resbuilder = require('../libraries/resultbuilder.js');
const db = require('../libraries/dbqueries.js');
// Congifiguration
const config = require('../config/auth-config.js');
// Middleware
const authVerification = require('../middleware/checkauth.js');

// Setup Express So That It Can Serve Pages
router.use(express.static('public'));

router.get('/test/fileserve', function (req, res) {
    res.sendFile(path.join(__dirname,'html','emailverification.html'));
})

// router.get('/verify/:verificationID', function (req, res) {
//     // Get Timer and Result Builder
//     var {timer, result} = initializeRoute(req);

//     var verID = req.params.verificationID

//     // There is nothing in the body for this request, it is a get request
//     function completedQuery(qres){
//         // TODO: Validate That Row Exists
//         if(qres.rowCount == 0){
//             // Failed To Verify Email
//             result.setStatus(404);
//             result.addError("Unable To Verify Email")
//             res.status(result.getStatus()).type('application/json').send(result.getPayload());
//             timer.endTimer(result);
//         }else{
//             if(qres.rows[0].verify_email){
//                 result.setStatus(204);
//                 res.status(result.getStatus()).type('application/json').send(result.getPayload());
//                 timer.endTimer(result);
//             }else{
//                 result.setStatus(404);
//                 result.addError("Unable To Verify Email")
//                 res.status(result.getStatus()).type('application/json').send(result.getPayload());
//                 timer.endTimer(result); 
//             }
            
//         }
//     }

//     function failedQuery(failure){
//         console.log("Failure Called")
//         if(failure.error){
//             result.setStatus(500);
//             result.addError("An Error Has Occured E100");
//             res.status(result.getStatus()).type('application/json').send(result.getPayload());
//             timer.endTimer(result);
//         }else{
//             console.log(failure.result)
//             result.setStatus(500);
//             result.addError("An Error Has Occured E100");
//             res.status(result.getStatus()).type('application/json').send(result.getPayload());
//             timer.endTimer(result);
//         }
//     }

//     // Basic Validation
//     result.setStatus(200);
//     res.status(result.getStatus()).type('application/json').send(result.getPayload());
//     timer.endTimer(result);

    
// });


module.exports = router;