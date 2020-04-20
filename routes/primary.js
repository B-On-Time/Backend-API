// Modules
const fs = require('fs');
const express = require('express');
var router = express.Router();
const { Pool } = require('pg');
const bodyParser = require('body-parser');
const uuidv4 = require('uuid/v4');
const _ = require('underscore');
var cors = require('cors');
var cookieParser = require('cookie-parser');
const bcrypt = require('bcryptjs');
var nodemailer = require('nodemailer');
//var mongoose = require('mongoose');
//var mongodb = require('mongodb');

// Libraries
const log = require('../libraries/logging.js');
const resbuilder = require('../libraries/resultbuilder.js');
const db = require('../libraries/dbqueries.js');

// Congifiguration
const config = require('../config/auth-config.js');

// Middleware
const authVerification = require('../middleware/checkauth.js');



// Route Setup
// Express Middleware Setup
// var whitelist = ['http://crabrr.com', 'https://crabrr.com', '']
// var corsOptions = {
//   origin: function (origin, callback) {
//     if (whitelist.indexOf(origin) !== -1) {
//       callback(null, true)
//     } else {
//         console.log(origin);
//       callback(new Error('Not allowed by CORS'))
//     }
//   },
//   optionsSuccessStatus: 200 // some legacy browsers (IE11, various SmartTVs) choke on 204
// }
// router.use(cors(corsOptions));

// TEST USING cors with options object {origin: true}
var corsOptions = {
    origin: true,
    methods: "GET,HEAD,PUT,PATCH,POST,DELETE",
    preflightContinue: false,
    credentials: true,
    optionsSuccessStatus: 200 // some legacy browsers (IE11, various SmartTVs) choke on 204
}
router.use(cors(corsOptions));
// router.use(function(req, res, next) {
//     res.header("Access-Control-Allow-Origin", "https://crabrr.com"); // update to match the domain you will make the request from
//     res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
//     res.header("Access-Control-Allow-Credentials", "true");
//     res.header('Access-Control-Allow-Methods', 'PUT, POST, GET, DELETE, OPTIONS');
//     if (req.method === "OPTIONS") {
//         return res.status(200).end();
//     }
//     next();
// });
router.use(cookieParser());

// Check For User Auth - If The request makes it past this point, it contains a valid authorization
router.use((req, res, next) => { return authVerification(req, res, next)});

// DB Setup
// Postgres Setup
const pool = new Pool( config.dbconfig.data );


// Setup NodeMailer
var transporter = nodemailer.createTransport({
    service: 'Gmail', // no need to set host or port etc.
    auth: {
        type: "login", // default
        user: config.email.email,
        pass: config.email.password
    }
  });

// // MongoDB Setup
// mongoose.connect(config.dbconfig.mongoTest.connectionString, {useNewUrlParser: true, useUnifiedTopology: true, useCreateIndex: true});
// var mongo = mongoose.connection;

// // Mongo DB Advanced Setup
// // Listen For Errors And Alert
// mongo.on('error', console.error.bind(console, 'connection error:'));

// // Alert On Connection Success
// mongo.once('open', function() {

//     // we're connected!
//     log.procedure("MongoDB Database Connected");
// });

// // Define A Schema
// var Schema = mongoose.Schema;
// var contactSchema = new Schema({
//     userID: String,
//     favorite: Boolean,
//     firstName : String,
//     middleName: String,
//     lastName: String,
//     phoneNumbers : [{name: String, value: String}],
//     emails : [{name: String, value: String}]
// });

// var Contact = mongoose.model('contacts', contactSchema);

// pool Setup
// the pool with emit an error on behalf of any idle clients
// it contains if a backend error or network partition happens
pool.on('error', (err, client) => {
    console.error('Unexpected error on idle client', err);
    process.exit(-1);
});

// Utility Functions
function initializeRoute(req){
    var timer = new log.callTimer(req);
    var result = new resbuilder.RestResult();
    return {
        timer: timer,
        result: result
    }
}

function pad(n, width, z) {
    z = z || '0';
    n = n + '';
    return n.length >= width ? n : new Array(width - n.length + 1).join(z) + n;
}

// Most Basic Behavior

// Clock IN
router.post('/clock/in', function (req, res) {

    // get timer and result builder
    var {timer, result} = initializeRoute(req);

    log.info("User Clocks IN")
    console.log(req.params)

    // get user id
    var userID = req.user.id;

    // get json body
    var body = req.body;

    // TODO: Validation

    // TODO: Permissions Checking

    // Assumes The Following Exist In Body
    // userId - Optional, If Not Given, Defaults to User Intends Self
    // eventDate - Optional, If Not Given, Defaults To NOW - If given must be in format YYYY-MM-DD
    // entryTime - Optional, If Not Given, Defaults To NOW - If Given Must Be In Format HH12:MI AM/PM
    // punchType - Required MUST BE ONE OF: WORK, PTO, UPTO, ADMIN
    // notes - Optional, Text. Defaults To Null

    var pgTimeStamp;
    var pgDate;
    var pgTime;
    if(_.has(body, 'eventDate') && _.has(body, 'entryTime') ){
        var d = new Date(body.eventDate + ' ' + body.entryTime);
        pgTimeStamp = d.getFullYear() + '-' + pad( (d.getMonth()+1), 2 ) + '-' + pad( (d.getDate()), 2) + ' ' +  pad( (d.getHours()), 2) + ':' +  pad( (d.getMinutes()), 2) + ':' +  pad( (d.getSeconds()), 2);  
        pgDate = d.getFullYear() + '-' + pad( (d.getMonth()+1), 2 ) + '-' + pad( (d.getDate()), 2);
        pgTime = pad( (d.getHours()), 2) + ':' +  pad( (d.getMinutes()), 2) + ':' +  pad( (d.getSeconds()), 2);
    }else{
        var d = new Date();
        pgTimeStamp = d.getFullYear() + '-' + pad( (d.getMonth()+1), 2 ) + '-' + pad( (d.getDate()), 2) + ' ' +  pad( (d.getHours()), 2) + ':' +  pad( (d.getMinutes()), 2) + ':' +  pad( (d.getSeconds()), 2);   
        pgDate = d.getFullYear() + '-' + pad( (d.getMonth()+1), 2 ) + '-' + pad( (d.getDate()), 2);
        pgTime = pad( (d.getHours()), 2) + ':' +  pad( (d.getMinutes()), 2) + ':' +  pad( (d.getSeconds()), 2);
    }

    var uid;
    if(_.has(body, 'userId')){
        // Todo Validate Permissions On User
        uid = body.userId;
    }else{
        // Default To Current User When None Is Given
        uid = userID;
    }

    var notes;
    if(_.has(body, 'notes')){
        notes = body.notes;
    }else{
        notes = null;
    }

    var allowedPunchTypes = ["WORK","PTO","UPTO","ADMIN"];
    var punchTypeCleaned;
    if(_.has(body, 'punchType')){
        if(allowedPunchTypes.includes(body.punchType)){
            punchTypeCleaned = body.punchType;
        }else{
            result.addError("Malformed Request - punchType is invalid. Allowed Values For punchType Are (WORK,PTO,UPTO,ADMIN)"); 
        }
    }else{
        result.addError("Malformed Request - Request Must Contain punchType in body. Allowed Values For punchType Are (WORK,PTO,UPTO,ADMIN)");
    }

    if(result.hasErrors()){
        result.setStatus(400);
        res.status(result.getStatus()).type('application/json').send(result.getPayload());
        timer.endTimer(result); 
    }else{
         // Check if User Currently Clocked In
        db.clock.status(pool, userID, uid, pgTimeStamp, completedStatusQuery, failedStatusQuery);

        function completedStatusQuery(qres){
            var statusOK = false;
            if(qres.rowCount == 0){
                statusOK = true;
            }else if(qres.rows[0].current_status != 'Clocked Out' ){
                statusOK = false;
            }else{
                statusOK = true;
            }
            
            if(statusOK){
                // Perform Clock In
                var values = [uid, pgDate, pgTime, punchTypeCleaned, notes];

                db.clock.in(pool, userID, values, completedQuery, failedQuery);

                function completedQuery(qres){
                    var packed = {
                        punch_id: qres.rows[0].punch_event_id,
                    };
                    result.setStatus(200);
                    result.setPayload(packed);
                    res.status(result.getStatus()).type('application/json').send(result.getPayload());
                    timer.endTimer(result);
                }

                function failedQuery(failure){
                    console.log("Failure Called")
                    if(failure.error){
                        result.setStatus(500);
                        result.addError("An Error Has Occured E100");
                        res.status(result.getStatus()).type('application/json').send(result.getPayload());
                        timer.endTimer(result);
                    }else{
                        console.log(failure.result)
                        result.setStatus(500);
                        result.addError("An Error Has Occured E100");
                        res.status(result.getStatus()).type('application/json').send(result.getPayload());
                        timer.endTimer(result);
                    }
                }
            }else{
                result.setStatus(403);
                result.addError("Cannot Clock In, Already Clocked In");
                res.status(result.getStatus()).type('application/json').send(result.getPayload());
                timer.endTimer(result); 
            }
        }

        function failedStatusQuery(failure){
            console.log("Failure Called")
            if(failure.error){
                result.setStatus(500);
                result.addError("An Error Has Occured E100");
                res.status(result.getStatus()).type('application/json').send(result.getPayload());
                timer.endTimer(result);
            }else{
                console.log(failure.result)
                result.setStatus(500);
                result.addError("An Error Has Occured E100");
                res.status(result.getStatus()).type('application/json').send(result.getPayload());
                timer.endTimer(result);
            }
        }
    }

   

    
});

// Clock OUT
router.post('/clock/out', function (req, res) {

    // get timer and result builder
    var {timer, result} = initializeRoute(req);

    log.info("Searching...")
    console.log(req.params)

    // get user id
    var userID = req.user.id;

    // get json body
    var body = req.body;

    // TODO: Validation

    // TODO: Permissions Checking

    // Assumes The Following Exist In Body
    // userId
    // eventDate
    // entryTime
    // punchType
    // notes

    var pgTimeStamp;
    var pgDate;
    var pgTime;
    if(_.has(body, 'eventDate') && _.has(body, 'entryTime') ){
        var d = new Date(body.eventDate + ' ' + body.entryTime);
        pgTimeStamp = d.getFullYear() + '-' + pad( (d.getMonth()+1), 2 ) + '-' + pad( (d.getDate()), 2) + ' ' +  pad( (d.getHours()), 2) + ':' +  pad( (d.getMinutes()), 2) + ':' +  pad( (d.getSeconds()), 2);  
        pgDate = d.getFullYear() + '-' + pad( (d.getMonth()+1), 2 ) + '-' + pad( (d.getDate()), 2);
        pgTime = pad( (d.getHours()), 2) + ':' +  pad( (d.getMinutes()), 2) + ':' +  pad( (d.getSeconds()), 2);
    }else{
        var d = new Date();
        pgTimeStamp = d.getFullYear() + '-' + pad( (d.getMonth()+1), 2 ) + '-' + pad( (d.getDate()), 2) + ' ' +  pad( (d.getHours()), 2) + ':' +  pad( (d.getMinutes()), 2) + ':' +  pad( (d.getSeconds()), 2);   
        pgDate = d.getFullYear() + '-' + pad( (d.getMonth()+1), 2 ) + '-' + pad( (d.getDate()), 2);
        pgTime = pad( (d.getHours()), 2) + ':' +  pad( (d.getMinutes()), 2) + ':' +  pad( (d.getSeconds()), 2);
    }

    var uid;
    if(_.has(body, 'userId')){
        // Todo Validate Permissions On User
        uid = body.userId;
    }else{
        // Default To Current User When None Is Given
        uid = userID;
    }

    var notes;
    if(_.has(body, 'notes')){
        notes = body.notes;
    }else{
        notes = null;
    }

    var allowedPunchTypes = ["WORK","PTO","UPTO","ADMIN"];
    var punchTypeCleaned;
    if(_.has(body, 'punchType')){
        if(allowedPunchTypes.includes(body.punchType)){
            punchTypeCleaned = body.punchType;
        }else{
            result.addError("Malformed Request - punchType is invalid. Allowed Values For punchType Are (WORK,PTO,UPTO,ADMIN)"); 
        }
    }else{
        result.addError("Malformed Request - Request Must Contain punchType in body. Allowed Values For punchType Are (WORK,PTO,UPTO,ADMIN)");
    }

    if(result.hasErrors()){
        result.setStatus(400);
        res.status(result.getStatus()).type('application/json').send(result.getPayload());
        timer.endTimer(result); 
    }else{

        // Check if User Currently Clocked In
        db.clock.status(pool, userID, uid, pgTimeStamp, completedStatusQuery, failedStatusQuery);

        function completedStatusQuery(qres){
            var statusOK = 'OK';
            if(qres.rowCount == 0){
                statusOK = 'Cannot Clock Out, Not Clocked In';
            }else if(qres.rows[0].current_status == 'On Break'){
                statusOK = 'Cannot Clock Out, Currently On Break. End Break, Then Clock Out';
            }else if(qres.rows[0].current_status == 'Clocked Out'){
                statusOK = 'Cannot Clock Out, Already Clocked Out';
            }else{
                statusOK = 'OK';
            }
            
            if(statusOK == 'OK'){
                // Perform Clock In
                var values = [uid, pgDate, pgTime, punchTypeCleaned, notes];

                db.clock.out(pool, userID, values, completedQuery, failedQuery);

                function completedQuery(qres){
                    var packed = {
                        punch_id: qres.rows[0].punch_event_id,
                    };
                    result.setStatus(200);
                    result.setPayload(packed);
                    res.status(result.getStatus()).type('application/json').send(result.getPayload());
                    timer.endTimer(result);
                }

                function failedQuery(failure){
                    console.log("Failure Called")
                    if(failure.error){
                        result.setStatus(500);
                        result.addError("An Error Has Occured E100");
                        res.status(result.getStatus()).type('application/json').send(result.getPayload());
                        timer.endTimer(result);
                    }else{
                        console.log(failure.result)
                        result.setStatus(500);
                        result.addError("An Error Has Occured E100");
                        res.status(result.getStatus()).type('application/json').send(result.getPayload());
                        timer.endTimer(result);
                    }
                }
            }else{
                result.setStatus(403);
                result.addError(statusOK);
                res.status(result.getStatus()).type('application/json').send(result.getPayload());
                timer.endTimer(result); 
            }
        }

        function failedStatusQuery(failure){
            console.log("Failure Called")
            if(failure.error){
                result.setStatus(500);
                result.addError("An Error Has Occured E100");
                res.status(result.getStatus()).type('application/json').send(result.getPayload());
                timer.endTimer(result);
            }else{
                console.log(failure.result)
                result.setStatus(500);
                result.addError("An Error Has Occured E100");
                res.status(result.getStatus()).type('application/json').send(result.getPayload());
                timer.endTimer(result);
            }
        }
    }
});

// Break IN
router.post('/break/start', function (req, res) {

    // get timer and result builder
    var {timer, result} = initializeRoute(req);

    log.info("User Clocks IN")
    console.log(req.params)

    // get user id
    var userID = req.user.id;

    // get json body
    var body = req.body;

    // TODO: Validation

    // TODO: Permissions Checking

    // Assumes The Following Exist In Body
    // userId
    // eventDate
    // entryTime
    // punchType
    // notes

    var pgTimeStamp;
    var pgDate;
    var pgTime;
    if(_.has(body, 'eventDate') && _.has(body, 'entryTime') ){
        var d = new Date(body.eventDate + ' ' + body.entryTime);
        pgTimeStamp = d.getFullYear() + '-' + pad( (d.getMonth()+1), 2 ) + '-' + pad( (d.getDate()), 2) + ' ' +  pad( (d.getHours()), 2) + ':' +  pad( (d.getMinutes()), 2) + ':' +  pad( (d.getSeconds()), 2);  
        pgDate = d.getFullYear() + '-' + pad( (d.getMonth()+1), 2 ) + '-' + pad( (d.getDate()), 2);
        pgTime = pad( (d.getHours()), 2) + ':' +  pad( (d.getMinutes()), 2) + ':' +  pad( (d.getSeconds()), 2);
    }else{
        var d = new Date();
        pgTimeStamp = d.getFullYear() + '-' + pad( (d.getMonth()+1), 2 ) + '-' + pad( (d.getDate()), 2) + ' ' +  pad( (d.getHours()), 2) + ':' +  pad( (d.getMinutes()), 2) + ':' +  pad( (d.getSeconds()), 2);   
        pgDate = d.getFullYear() + '-' + pad( (d.getMonth()+1), 2 ) + '-' + pad( (d.getDate()), 2);
        pgTime = pad( (d.getHours()), 2) + ':' +  pad( (d.getMinutes()), 2) + ':' +  pad( (d.getSeconds()), 2);
    }

    var uid;
    if(_.has(body, 'userId')){
        // Todo Validate Permissions On User
        uid = body.userId;
    }else{
        // Default To Current User When None Is Given
        uid = userID;
    }

    var notes;
    if(_.has(body, 'notes')){
        notes = body.notes;
    }else{
        notes = null;
    }

    var allowedPunchTypes = ["WORK","PTO","UPTO","ADMIN"];
    var punchTypeCleaned;
    if(_.has(body, 'punchType')){
        if(allowedPunchTypes.includes(body.punchType)){
            punchTypeCleaned = body.punchType;
        }else{
            result.addError("Malformed Request - punchType is invalid. Allowed Values For punchType Are (WORK,PTO,UPTO,ADMIN)"); 
        }
    }else{
        result.addError("Malformed Request - Request Must Contain punchType in body. Allowed Values For punchType Are (WORK,PTO,UPTO,ADMIN)");
    }

    if(result.hasErrors()){
        result.setStatus(400);
        res.status(result.getStatus()).type('application/json').send(result.getPayload());
        timer.endTimer(result); 
    }else{
        // Check if User Currently Clocked In
        db.clock.status(pool, userID, uid, pgTimeStamp, completedStatusQuery, failedStatusQuery);

        function completedStatusQuery(qres){
            var statusOK = 'OK';
            if(qres.rowCount == 0){
                statusOK = 'Cannot Start Break, Not Clocked In';
            }else if(qres.rows[0].current_status == 'On Break'){
                statusOK = 'Cannot Start Break, Currently On Break. End Break, Then Start Another';
            }else if(qres.rows[0].current_status == 'Clocked Out'){
                statusOK = 'Cannot Start Break, While Clocked Out';
            }else{
                statusOK = 'OK';
            }
            
            if(statusOK == 'OK'){
                // Perform Clock In
                var values = [uid, pgDate, pgTime, punchTypeCleaned, notes];

                db.clockBreak.start(pool, userID, values, completedQuery, failedQuery);

                function completedQuery(qres){
                    var packed = {
                        punch_id: qres.rows[0].punch_event_id,
                    };
                    result.setStatus(200);
                    result.setPayload(packed);
                    res.status(result.getStatus()).type('application/json').send(result.getPayload());
                    timer.endTimer(result);
                }

                function failedQuery(failure){
                    console.log("Failure Called")
                    if(failure.error){
                        result.setStatus(500);
                        result.addError("An Error Has Occured E100");
                        res.status(result.getStatus()).type('application/json').send(result.getPayload());
                        timer.endTimer(result);
                    }else{
                        console.log(failure.result)
                        result.setStatus(500);
                        result.addError("An Error Has Occured E100");
                        res.status(result.getStatus()).type('application/json').send(result.getPayload());
                        timer.endTimer(result);
                    }
                }
            }else{
                result.setStatus(403);
                result.addError(statusOK);
                res.status(result.getStatus()).type('application/json').send(result.getPayload());
                timer.endTimer(result); 
            }
        }

        function failedStatusQuery(failure){
            console.log("Failure Called")
            if(failure.error){
                result.setStatus(500);
                result.addError("An Error Has Occured E100");
                res.status(result.getStatus()).type('application/json').send(result.getPayload());
                timer.endTimer(result);
            }else{
                console.log(failure.result)
                result.setStatus(500);
                result.addError("An Error Has Occured E100");
                res.status(result.getStatus()).type('application/json').send(result.getPayload());
                timer.endTimer(result);
            }
        }
    }
});

// Break OUT
router.post('/break/end', function (req, res) {

    // get timer and result builder
    var {timer, result} = initializeRoute(req);

    log.info("Searching...")
    console.log(req.params)

    // get user id
    var userID = req.user.id;

    // get json body
    var body = req.body;

    // TODO: Validation

    // TODO: Permissions Checking

    // Assumes The Following Exist In Body
    // userId
    // eventDate
    // entryTime
    // punchType
    // notes

    // Check if User Currently Clocked In

    var pgTimeStamp;
    var pgDate;
    var pgTime;
    if(_.has(body, 'eventDate') && _.has(body, 'entryTime') ){
        var d = new Date(body.eventDate + ' ' + body.entryTime);
        pgTimeStamp = d.getFullYear() + '-' + pad( (d.getMonth()+1), 2 ) + '-' + pad( (d.getDate()), 2) + ' ' +  pad( (d.getHours()), 2) + ':' +  pad( (d.getMinutes()), 2) + ':' +  pad( (d.getSeconds()), 2);  
        pgDate = d.getFullYear() + '-' + pad( (d.getMonth()+1), 2 ) + '-' + pad( (d.getDate()), 2);
        pgTime = pad( (d.getHours()), 2) + ':' +  pad( (d.getMinutes()), 2) + ':' +  pad( (d.getSeconds()), 2);
    }else{
        var d = new Date();
        pgTimeStamp = d.getFullYear() + '-' + pad( (d.getMonth()+1), 2 ) + '-' + pad( (d.getDate()), 2) + ' ' +  pad( (d.getHours()), 2) + ':' +  pad( (d.getMinutes()), 2) + ':' +  pad( (d.getSeconds()), 2);   
        pgDate = d.getFullYear() + '-' + pad( (d.getMonth()+1), 2 ) + '-' + pad( (d.getDate()), 2);
        pgTime = pad( (d.getHours()), 2) + ':' +  pad( (d.getMinutes()), 2) + ':' +  pad( (d.getSeconds()), 2);
    }

    var uid;
    if(_.has(body, 'userId')){
        // Todo Validate Permissions On User
        uid = body.userId;
    }else{
        // Default To Current User When None Is Given
        uid = userID;
    }

    var notes;
    if(_.has(body, 'notes')){
        notes = body.notes;
    }else{
        notes = null;
    }

    var allowedPunchTypes = ["WORK","PTO","UPTO","ADMIN"];
    var punchTypeCleaned;
    if(_.has(body, 'punchType')){
        if(allowedPunchTypes.includes(body.punchType)){
            punchTypeCleaned = body.punchType;
        }else{
            result.addError("Malformed Request - punchType is invalid. Allowed Values For punchType Are (WORK,PTO,UPTO,ADMIN)"); 
        }
    }else{
        result.addError("Malformed Request - Request Must Contain punchType in body. Allowed Values For punchType Are (WORK,PTO,UPTO,ADMIN)");
    }

    if(result.hasErrors()){
        result.setStatus(400);
        res.status(result.getStatus()).type('application/json').send(result.getPayload());
        timer.endTimer(result); 
    }else{
        db.clock.status(pool, userID, uid, pgTimeStamp, completedStatusQuery, failedStatusQuery);

        function completedStatusQuery(qres){
            var statusOK = 'OK';
            if(qres.rowCount == 0){
                statusOK = 'Cannot End Break, Not Clocked In';
            }else if(qres.rows[0].current_status == 'Back From Break'){
                statusOK = 'Cannot End Break, Already Back From Break. Start A New Break, Then End It.';
            }else if(qres.rows[0].current_status == 'Clocked Out'){
                statusOK = 'Cannot End Break, While Clocked Out';
            }else{
                statusOK = 'OK';
            }
            
            if(statusOK == 'OK'){
                // Perform Clock In
                var values = [uid, pgDate, pgTime, punchTypeCleaned, notes];

                db.clockBreak.end(pool, userID, values, completedQuery, failedQuery);

                function completedQuery(qres){
                    var packed = {
                        punch_id: qres.rows[0].punch_event_id,
                    };
                    result.setStatus(200);
                    result.setPayload(packed);
                    res.status(result.getStatus()).type('application/json').send(result.getPayload());
                    timer.endTimer(result);
                }

                function failedQuery(failure){
                    console.log("Failure Called")
                    if(failure.error){
                        result.setStatus(500);
                        result.addError("An Error Has Occured E100");
                        res.status(result.getStatus()).type('application/json').send(result.getPayload());
                        timer.endTimer(result);
                    }else{
                        console.log(failure.result)
                        result.setStatus(500);
                        result.addError("An Error Has Occured E100");
                        res.status(result.getStatus()).type('application/json').send(result.getPayload());
                        timer.endTimer(result);
                    }
                }
            }else{
                result.setStatus(403);
                result.addError(statusOK);
                res.status(result.getStatus()).type('application/json').send(result.getPayload());
                timer.endTimer(result); 
            }
        }

        function failedStatusQuery(failure){
            console.log("Failure Called")
            if(failure.error){
                result.setStatus(500);
                result.addError("An Error Has Occured E100");
                res.status(result.getStatus()).type('application/json').send(result.getPayload());
                timer.endTimer(result);
            }else{
                console.log(failure.result)
                result.setStatus(500);
                result.addError("An Error Has Occured E100");
                res.status(result.getStatus()).type('application/json').send(result.getPayload());
                timer.endTimer(result);
            }
        }
    }
});

// Check Clock Status
router.post('/clock/status', function (req, res) {

    // get timer and result builder
    var {timer, result} = initializeRoute(req);

    log.info("Searching...")
    console.log(req.params)

    // get user id
    var userID = req.user.id;

    // get json body
    var body = req.body;

    // TODO: Validation

    // TODO: Permissions Checking

    // Assumes The Following Exist In Body
    // userId - User you seek to lookup the staus of, OPTIONAL, if NULL then assume user is self
    // seekTimestamp FORMAT: 'YYYY-MM-DD HH:MM:SS' OR NULL, NULL will assume that status is for current time

    var userId;
    if(_.has(body, 'userId')){
        userId = body.userId;
    }else{
        userId = userID;
    }

    var pgTimeStamp;
    if(_.has(body, 'seekTimestamp')){
        pgTimeStamp = body.seekTimestamp;
    }else{
        var d = new Date();
        var pgTimeStamp = d.getFullYear() + '-' + pad( (d.getMonth()+1), 2 ) + '-' + pad( (d.getDate()), 2) + ' ' +  pad( (d.getHours()), 2) + ':' +  pad( (d.getMinutes()), 2) + ':' +  pad( (d.getSeconds()), 2);   
    }

    db.clock.status(pool, userID, body.userId, pgTimeStamp, completedQuery, failedQuery);

    function completedQuery(qres){
        var recs = [];
        qres.rows.forEach(r => {
            recs.push({
                punchID: r.punch_id,
                punchType: r.punchType,
                punchDay: r.clock_day,
                punchEventID: r.punch_event_id,
                punchEventTimestamp: r.clock_time,
                currentStatus: r.current_status,
                currentTimer: r.for_interval
            });
        });
        var packed = {
            records: recs
        };
        result.setStatus(200);
        result.setPayload(packed);
        res.status(result.getStatus()).type('application/json').send(result.getPayload());
        timer.endTimer(result);
    }

    function failedQuery(failure){
        console.log("Failure Called")
        if(failure.error){
            result.setStatus(500);
            result.addError("An Error Has Occured E100");
            res.status(result.getStatus()).type('application/json').send(result.getPayload());
            timer.endTimer(result);
        }else{
            console.log(failure.result)
            result.setStatus(500);
            result.addError("An Error Has Occured E100");
            res.status(result.getStatus()).type('application/json').send(result.getPayload());
            timer.endTimer(result);
        }
    }
});

// Check Clock Status For All Users
router.post('/clock/status/all', function (req, res) {

    // get timer and result builder
    var {timer, result} = initializeRoute(req);

    log.info("Searching...")
    console.log(req.params)

    // get user id
    var userID = req.user.id;

    // get json body
    var body = req.body;

    // TODO: Validation

    // TODO: Permissions Checking

    // Assumes The Following Exist In Body
    // seekTimestamp - Optional - Assumes Now if Not Included FORMAT: 'YYYY-MM-DD HH:MM:SS' OR NULL, NULL will assume that status is for current time


    var pgTimeStamp;
    if(_.has(body, 'seekTimestamp')){
        pgTimeStamp = body.seekTimestamp;
    }else{
        var d = new Date();
        var pgTimeStamp = d.getFullYear() + '-' + pad( (d.getMonth()+1), 2 ) + '-' + pad( (d.getDate()), 2) + ' ' +  pad( (d.getHours()), 2) + ':' +  pad( (d.getMinutes()), 2) + ':' +  pad( (d.getSeconds()), 2);   
    }

    db.clock.allUserStatuses(pool, userID, pgTimeStamp, completedQuery, failedQuery);

    function completedQuery(qres){
        var recs = [];
        qres.rows.forEach(r => {
            recs.push({
                punchID: r.punch_id,
                userID: r.user_id,
                userName: r.user_full_name,
                punchType: r.punchType,
                punchDay: r.clock_day,
                punchEventID: r.punch_event_id,
                punchEventTimestamp: r.clock_time,
                currentStatus: r.current_status,
                currentTimer: r.for_interval
            });
        });
        var packed = {
            records: recs
        };
        result.setStatus(200);
        result.setPayload(packed);
        res.status(result.getStatus()).type('application/json').send(result.getPayload());
        timer.endTimer(result);
    }

    function failedQuery(failure){
        console.log("Failure Called")
        if(failure.error){
            result.setStatus(500);
            result.addError("An Error Has Occured E100");
            res.status(result.getStatus()).type('application/json').send(result.getPayload());
            timer.endTimer(result);
        }else{
            console.log(failure.result)
            result.setStatus(500);
            result.addError("An Error Has Occured E100");
            res.status(result.getStatus()).type('application/json').send(result.getPayload());
            timer.endTimer(result);
        }
    }
});

// List All Permissions Sets
router.get('/permissions/list', function (req, res) {

    // get timer and result builder
    var {timer, result} = initializeRoute(req);

    log.info("Searching...")
    console.log(req.params)

    // get user id
    var userID = req.user.id;

    // There is nothing in the body for this request, it is a get request

    db.permissions.list(pool, completedQuery, failedQuery);

    function completedQuery(qres){
        var packed = qres.rows;

        result.setStatus(200);
        result.setPayload(packed);
        res.status(result.getStatus()).type('application/json').send(result.getPayload());
        timer.endTimer(result);
    }

    function failedQuery(failure){
        console.log("Failure Called")
        if(failure.error){
            result.setStatus(500);
            result.addError("An Error Has Occured E100");
            res.status(result.getStatus()).type('application/json').send(result.getPayload());
            timer.endTimer(result);
        }else{
            console.log(failure.result)
            result.setStatus(500);
            result.addError("An Error Has Occured E100");
            res.status(result.getStatus()).type('application/json').send(result.getPayload());
            timer.endTimer(result);
        }
    }
});

// Get Permission Set For Current Role User Or Specified User
router.post('/permissions', function (req, res) {

    // get timer and result builder
    var {timer, result} = initializeRoute(req);

    log.info("Searching...")
    console.log(req.params)

    // get user id
    var userID = req.user.id;

    // Optional Body Can Include
    // userID - which is the user you wish to view the permission set of

    // get json body
    var body = req.body;

    // TODO: Validation
    if(_.has(body, 'userId')){
        db.permissions.userByID(pool, body.userId, completedQuery, failedQuery);
    }else{
        db.permissions.userByRole(pool, userID, completedQuery, failedQuery);
    }

    // There is nothing in the body for this request, it is a get request
    function completedQuery(qres){
        // TODO: Validate That Row Exists

        // TODO: Document Result
        var packed = qres.rows[0];

        result.setStatus(200);
        result.setPayload(packed);
        res.status(result.getStatus()).type('application/json').send(result.getPayload());
        timer.endTimer(result);
    }

    function failedQuery(failure){
        console.log("Failure Called")
        if(failure.error){
            result.setStatus(500);
            result.addError("An Error Has Occured E100");
            res.status(result.getStatus()).type('application/json').send(result.getPayload());
            timer.endTimer(result);
        }else{
            console.log(failure.result)
            result.setStatus(500);
            result.addError("An Error Has Occured E100");
            res.status(result.getStatus()).type('application/json').send(result.getPayload());
            timer.endTimer(result);
        }
    }
});

// post /user - create user
router.post('/user', function (req, res) {

    // get timer and result builder
    var {timer, result} = initializeRoute(req);

    // get user id
    var userID = req.user.id;

    // get json body
    var body = req.body;

    // TODO: Validation

    // TODO: Permissions Checking

    // The Following Elements Are Required For User Creation
    // firstName - text
    // middleName - text
    // lastName - text
    // email - text
    // password - text
    // permissions - OPTIONAL: UUID of permission set, if null defaults to standard employee

    var permID;
    if(_.has(body, 'permissions')){
        permID = body.permissions;
    }else{
        permID = 'c779a171-c434-4900-9c1c-3ea48e14368c';
    }
    
    // TODO Validate Required Fields

    // Performs The Following Steps
    // Create User Row - Return user_id
    // Hash Password and Create User Auth With PIN Generation
    // Return PinCode and Generated User
    // Sends Verification Email

    // Bcrypt the Password
    bcrypt.hash( body.password, 10 ).then( async (hash) => {
        arguments.callee.displayName = "post-create-user";
        //Create Param
        var values = [body.firstName, body.middleName, body.lastName, body.email, permID, hash];

        db.user.create(pool, userID, values, successCallback, failureCallback);

        function successCallback(qres){
            var resp = qres.rows[0];
            // Respond With OK And 200
            console.log(qres);
            var packed = {
                userID: resp.user_id,
                firstName: resp.first_name,
                middleName: resp.middle_name,
                lastName: resp.last_name,
                email: resp.email,
                kioskPIN: resp.pin,
            };

            // Build Email
            var mailOptions = {
                from: config.email.email,
                to: resp.email,
                subject: 'B-On-Time Email Verification',
                text: 'Follow This Link To Verify Your Email </br>' + config.domain.fqdn + '/verifyemail/' + resp.email_verification
            };

            // Send Email
            transporter.sendMail(mailOptions, function(error, info){
                if (error) {
                    console.log(error);
                } else {
                    console.log('Email sent: ' + info.response);
                }
            }); 
        
            result.setStatus(200);
            result.setPayload(packed);
            res.status(result.getStatus()).type('application/json').send(result.getPayload());
            timer.endTimer(result);
        }
    
        function failureCallback(failure){
            console.log("DB Query Failed")
            if(failure.error){
                console.log(failure.error.name);
                //console.log(failure.error.message);
                if(failure.error.constraint == 'users_email_key'){
                    result.setStatus(403);
                    result.addError("User Already Exists");
                    res.status(result.getStatus()).type('application/json').send(result.getPayload());
                    timer.endTimer(result);
                }else{
                    result.setStatus(500);
                    result.addError("An Error Has Occured E100");
                    res.status(result.getStatus()).type('application/json').send(result.getPayload());
                    timer.endTimer(result);
                }
               
            }else{
                console.log(failure.result)
                if(failure.result == "USERNAME ALREADY EXISTS"){
                    result.setStatus(403);
                    result.addError("User Already Exists");
                    res.status(result.getStatus()).type('application/json').send(result.getPayload());
                    timer.endTimer(result);
                }else{
                    result.setStatus(403);
                    result.addError("User Already Exists");
                    res.status(result.getStatus()).type('application/json').send(result.getPayload());
                    timer.endTimer(result);
                }
            }
        }
    });
});

// put /user/:id - Update User - Updates In Place User
router.put('/user/:id', function (req, res) {

    // get timer and result builder
    var {timer, result} = initializeRoute(req);

    // get user id
    var userID = req.user.id;

    // get json body
    var body = req.body;

    // Get id to update
    var userId = req.params.id

    // TODO: Validation
    
    // TODO: Check For Unique On Email Entry

    // TODO: Permissions Checking

    // The Following Elements Are Required For User Creation
    // firstName - text
    // middleName - text
    // lastName - text
    // email - text
    // permissions - OPTIONAL: UUID of permission set, if null defaults to standard employee

    var permID;
    if(_.has(body, 'permissions')){
        permID = body.permissions;
    }else{
        permID = 'c779a171-c434-4900-9c1c-3ea48e14368c';
    }
    
    // TODO Validate Required Fields

    var values = [permID, body.email, body.firstName, body.middleName, body.lastName, userId];

    db.user.edit(pool, userID, values, successCallback, failureCallback);

    function successCallback(qres){
        // Respond With OK And 200
        result.setStatus(204);
        res.status(result.getStatus()).type('application/json').send(result.getPayload());
        timer.endTimer(result);
    }

    function failureCallback(failure){
        console.log("DB Query Failed")
        if(failure.error){
            console.log(failure.error.name);
            //console.log(failure.error.message);
            if(failure.error.constraint == 'users_email_key'){
                result.setStatus(403);
                result.addError("User Already Exists");
                res.status(result.getStatus()).type('application/json').send(result.getPayload());
                timer.endTimer(result);
            }else{
                result.setStatus(500);
                result.addError("An Error Has Occured E100");
                res.status(result.getStatus()).type('application/json').send(result.getPayload());
                timer.endTimer(result);
            }
            
        }else{
            result.setStatus(500);
            result.addError("An Error Has Occured E100");
            res.status(result.getStatus()).type('application/json').send(result.getPayload());
            timer.endTimer(result);
        }
    }
});

// get /user/:id - Get Info On Single User
router.get('/user/:id', function (req, res) {

    // get timer and result builder
    var {timer, result} = initializeRoute(req);

    log.info("Searching...")
    console.log(req.params)

    // get user id
    var userID = req.user.id;

    // There is nothing in the body for this request, it is a get request

    var values = [userId];
    db.user.view(pool, userID, values, completedQuery, failedQuery);

    function completedQuery(qres){
        if(qres.rowCount == 0){
            result.setStatus(404);
            result.addError("Unable To Find User With Specified ID")
            res.status(result.getStatus()).type('application/json').send(result.getPayload());
            timer.endTimer(result);
        }else{
            var packed = qres.rows[0];
            result.setStatus(200);
            result.setPayload(packed);
            res.status(result.getStatus()).type('application/json').send(result.getPayload());
            timer.endTimer(result);
        }
        
    }

    function failedQuery(failure){
        console.log("Failure Called")
        if(failure.error){
            result.setStatus(500);
            result.addError("An Error Has Occured E100");
            res.status(result.getStatus()).type('application/json').send(result.getPayload());
            timer.endTimer(result);
        }else{
            console.log(failure.result)
            result.setStatus(500);
            result.addError("An Error Has Occured E100");
            res.status(result.getStatus()).type('application/json').send(result.getPayload());
            timer.endTimer(result);
        }
    }
});

// delete /user/:id - Deletes User

// post /user/updatepass - can only update own password
router.post('/user/updatepass', function (req, res) {

    // get timer and result builder
    var {timer, result} = initializeRoute(req);

    // get user id
    var userID = req.user.id;

    // get json body
    var body = req.body;

    // TODO: Validation that password is not null or blank

    // TODO: Permissions Checking

    // The Following Elements Are Required For User Creation
    // password - text
    
    // TODO Validate Required Fields

    // Performs The Following Steps
    // Create User Row - Return user_id
    // Hash Password and Create User Auth With PIN Generation
    // Return PinCode and Generated User
    // Sends Verification Email

    

    // Bcrypt the Password
    bcrypt.hash( body.password, 10 ).then( async (hash) => {
        arguments.callee.displayName = "post-create-user";
        //Create Param
        var values = [hash];

        db.user.updatePass(pool, userID, values, successCallback, failureCallback);

        function successCallback(qres){
            result.setStatus(204);
            res.status(result.getStatus()).type('application/json').send(result.getPayload());
            timer.endTimer(result);
        }
    
        function failureCallback(failure){
            console.log("DB Query Failed")
            if(failure.error){
                console.log(failure.error.name);
                //console.log(failure.error.message);
                if(failure.error.constraint == 'users_email_key'){
                    result.setStatus(403);
                    result.addError("User Already Exists");
                    res.status(result.getStatus()).type('application/json').send(result.getPayload());
                    timer.endTimer(result);
                }else{
                    result.setStatus(500);
                    result.addError("An Error Has Occured E100");
                    res.status(result.getStatus()).type('application/json').send(result.getPayload());
                    timer.endTimer(result);
                }
               
            }else{
                result.setStatus(500);
                result.addError("An Error Has Occured E100");
                res.status(result.getStatus()).type('application/json').send(result.getPayload());
                timer.endTimer(result);
            }
        }
    });
});

// List All Users
router.get('/user/list', function (req, res) {

    // get timer and result builder
    var {timer, result} = initializeRoute(req);

    log.info("Searching...")
    console.log(req.params)

    // get user id
    var userID = req.user.id;

    // There is nothing in the body for this request, it is a get request

    db.user.list(pool, userID, completedQuery, failedQuery);

    function completedQuery(qres){
        var packed = qres.rows;
        result.setStatus(200);
        result.setPayload(packed);
        res.status(result.getStatus()).type('application/json').send(result.getPayload());
        timer.endTimer(result);
    }

    function failedQuery(failure){
        console.log("Failure Called")
        if(failure.error){
            result.setStatus(500);
            result.addError("An Error Has Occured E100");
            res.status(result.getStatus()).type('application/json').send(result.getPayload());
            timer.endTimer(result);
        }else{
            console.log(failure.result)
            result.setStatus(500);
            result.addError("An Error Has Occured E100");
            res.status(result.getStatus()).type('application/json').send(result.getPayload());
            timer.endTimer(result);
        }
    }
});

// Report For Date, On User Or List of Users
router.post('/report', function (req, res) {

    // get timer and result builder
    var {timer, result} = initializeRoute(req);

    log.info("Searching...")
    console.log(req.params)

    // get user id
    var userID = req.user.id;

    // get json body
    var body = req.body;

    // Body Expects
    // startDate - FORMATTED YYYY-MM-DD
    // endDate - FORMATTED YYYY-MM-DD
    // userID - single user_id, or array of user_ids, if empty, assumes current user

    // Start Validation
    var cleaned = {
        startDate: null,
        endDate: null,
        userIds: null,
        uidIsArray: false
    }
    const correctDateFormat = /^\d{4}-(1|2|3|4|5|6|7|8|9|10|11|12|01|02|03|04|05|06|07|08|09)-\d{1,2}$/;
    // Check Start Date
    if(_.has(body, 'startDate')){
        // Must Match Regex Definition of Formatted Date
        if(correctDateFormat.test(body.startDate)){
            cleaned.startDate = body.startDate;
        }else{
            result.setStatus(400);
            result.addError("startDate Is Malformed - startDate Must Be Formatted As YYYY-MM-DD");
        }
    }else{
        result.setStatus(400);
        result.addError("Request Missing Required Key - Body Must Contain startDate (Formatted As YYYY-MM-DD)");
    }
    // Check End Date
    if(_.has(body, 'endDate')){
        // Must Match Regex Definition of Formatted Date
        if(correctDateFormat.test(body.endDate)){
            cleaned.endDate = body.endDate;
        }else{
            console.log(body.endDate)
            result.setStatus(400);
            result.addError("endDate Is Malformed - endDate Must Be Formatted As YYYY-MM-DD");
        }
    }else{
        result.setStatus(400);
        result.addError("Request Missing Required Key - Body Must Contain endDate (Formatted As YYYY-MM-DD)");
    }
    // Check If userID
    if(_.has(body, 'userID')){
        // Check if array
        if(_.isArray(body.userID)){
            // This is an array of ids
            // TODO: check each ID to validate that they are real users
            cleaned.userIds = body.userID;
            cleaned.uidIsArray = true;
        }else{
            // TODO: validate user id is real user id
            cleaned.userIds = body.userID;
            cleaned.uidIsArray = false;
        }
    }else{
        // Assume User Is Asking About Themselves
        cleaned.userIds = userID;
        cleaned.uidIsArray = false;
    }

    // Check If Result Has Errors
    if(!result.hasErrors()){
        // Build Required Values Array
        var values = [];
        if(cleaned.uidIsArray){
            values = ['{' + cleaned.userIds.join(',') + '}', cleaned.startDate, cleaned.endDate];
        }else{
            values = ['{' + cleaned.userIds + '}', cleaned.startDate, cleaned.endDate];
        }

        console.log(values);

        // Perform DB Query
        db.reporting.multi(pool, userID, values, completedQuery, failedQuery);

        function completedQuery(qres){
            // Package The Results Up
            var packed = {
                periodStart: cleaned.startDate,
                periodEnd: cleaned.endDate,
                reports: []
            };

            var ukey = {};

            /* ukey = {
                user_id : 
                    recs: [
                        {}
                    ]
                 }
            */
            // I Pray for the soul that should need to debug this
            var mostRecentRecIndex;
            qres.rows.forEach( (rep) => {
                var uid = rep.user_id;
                if(rep.clock_day != null){
                    // This is a clock entry for this user
                    var ttype = "clock";
                    var tmpObj = {
                        date: rep.clock_day,
                        type: rep.clock_type,
                        clockIn: rep.start_time,
                        clockOut: rep.end_time,
                        billableMins: rep.billable_minutes,
                        breakTotalMins: rep.minutes_on_break,
                        breaks: []
                    };
                    // Add The Key if it does not exist already
                    if(_.has(ukey, uid)){
                        var idex = ukey[uid].detail.push(tmpObj);
                        mostRecentRecIndex = idex-1;
                    }else{
                        ukey[uid] = {
                            meta: {
                                userID: uid,
                                fullName: rep.user_full_name,
                                totals: {
                                    work: 0,
                                    pto: 0,
                                    upto: 0,
                                    admin: 0
                                }
                            },
                            detail: []
                        };
                        var idex = ukey[uid].detail.push(tmpObj);
                        mostRecentRecIndex = idex-1;
                    }
                    if(rep.clock_type == 'WORK'){
                        if(rep.billable_minutes != null){
                            ukey[uid].meta.totals.work = ukey[uid].meta.totals.work + rep.billable_minutes;
                        }
                    }else if(rep.clock_type == 'PTO'){
                        if(rep.billable_minutes != null){
                            ukey[uid].meta.totals.pto = ukey[uid].meta.totals.pto + rep.billable_minutes;
                        }
                    }else if(rep.clock_type == 'UPTO'){
                        if(rep.billable_minutes != null){
                            ukey[uid].meta.totals.upto = ukey[uid].meta.totals.upto + rep.billable_minutes;
                        }
                    }else{
                        if(rep.billable_minutes != null){
                            ukey[uid].meta.totals.admin = ukey[uid].meta.totals.admin + rep.billable_minutes;
                        }
                    }
                    console.log(ukey[uid]); 
                }else{
                    // This is a break entry for this user
                    var breakObj = {
                        breakStart: rep.start_time,
                        breakEnd: rep.end_time,
                        breakMins: rep.minutes_on_break
                    };
                    ukey[uid].detail[mostRecentRecIndex].breaks.push(breakObj);
                }
            });

            console.log(ukey);
            // Probably should have used .map here, but w/e
            var ukeyKeys = _.keys(ukey);
            ukeyKeys.forEach((k)=>{
                packed.reports.push(ukey[k]);
            });
            result.setStatus(200);
            result.setPayload(packed);
            res.status(result.getStatus()).type('application/json').send(result.getPayload());
            timer.endTimer(result);
        }

        function failedQuery(failure){
            console.log("Failure Called")
            if(failure.error){
                result.setStatus(500);
                result.addError("An Error Has Occured E100");
                res.status(result.getStatus()).type('application/json').send(result.getPayload());
                timer.endTimer(result);
            }else{
                console.log(failure.result)
                result.setStatus(500);
                result.addError("An Error Has Occured E100");
                res.status(result.getStatus()).type('application/json').send(result.getPayload());
                timer.endTimer(result);
            }
        }
    }else{
        // Can Go No Further Will Error Filled Garbage
        res.status(result.getStatus()).type('application/json').send(result.getPayload());
        timer.endTimer(result);
    }
});

// Report For Date For ALL Users
router.post('/report/all', function (req, res) {

    // get timer and result builder
    var {timer, result} = initializeRoute(req);

    log.info("Searching...")
    console.log(req.params)

    // get user id
    var userID = req.user.id;

    // get json body
    var body = req.body;

    // Body Expects
    // startDate - FORMATTED YYYY-MM-DD
    // endDate - FORMATTED YYYY-MM-DD

    // Start Validation
    var cleaned = {
        startDate: null,
        endDate: null
    }
    const correctDateFormat = /^\d{4}-(1|2|3|4|5|6|7|8|9|10|11|12|01|02|03|04|05|06|07|08|09)-\d{1,2}$/;
    // Check Start Date
    if(_.has(body, 'startDate')){
        // Must Match Regex Definition of Formatted Date
        if(correctDateFormat.test(body.startDate)){
            cleaned.startDate = body.startDate;
        }else{
            result.setStatus(400);
            result.addError("startDate Is Malformed - startDate Must Be Formatted As YYYY-MM-DD");
        }
    }else{
        result.setStatus(400);
        result.addError("Request Missing Required Key - Body Must Contain startDate (Formatted As YYYY-MM-DD)");
    }
    // Check End Date
    if(_.has(body, 'endDate')){
        // Must Match Regex Definition of Formatted Date
        if(correctDateFormat.test(body.endDate)){
            cleaned.endDate = body.endDate;
        }else{
            console.log(body.endDate)
            result.setStatus(400);
            result.addError("endDate Is Malformed - endDate Must Be Formatted As YYYY-MM-DD");
        }
    }else{
        result.setStatus(400);
        result.addError("Request Missing Required Key - Body Must Contain endDate (Formatted As YYYY-MM-DD)");
    }

    // Check If Result Has Errors
    if(!result.hasErrors()){
        // Build Required Values Array
        var values = [cleaned.startDate, cleaned.endDate];

        // Perform DB Query
        db.reporting.all(pool, userID, values, completedQuery, failedQuery);

        function completedQuery(qres){
            // Package The Results Up
            var packed = {
                periodStart: cleaned.startDate,
                periodEnd: cleaned.endDate,
                reports: []
            };

            var ukey = {};

            /* ukey = {
                user_id : 
                    recs: [
                        {}
                    ]
                 }
            */
            // I Pray for the soul that should need to debug this
            var mostRecentRecIndex;
            qres.rows.forEach( (rep) => {
                var uid = rep.user_id;
                if(rep.clock_day != null){
                    // This is a clock entry for this user
                    var ttype = "clock";
                    var tmpObj = {
                        date: rep.clock_day,
                        type: rep.clock_type,
                        clockIn: rep.start_time,
                        clockOut: rep.end_time,
                        billableMins: rep.billable_minutes,
                        breakTotalMins: rep.minutes_on_break,
                        breaks: []
                    };
                    // Add The Key if it does not exist already
                    if(_.has(ukey, uid)){
                        var idex = ukey[uid].detail.push(tmpObj);
                        mostRecentRecIndex = idex-1;
                    }else{
                        ukey[uid] = {
                            meta: {
                                userID: uid,
                                fullName: rep.user_full_name,
                                totals: {
                                    work: 0,
                                    pto: 0,
                                    upto: 0,
                                    admin: 0
                                }
                            },
                            detail: []
                        };
                        var idex = ukey[uid].detail.push(tmpObj);
                        mostRecentRecIndex = idex-1;
                    }
                    if(rep.clock_type == 'WORK'){
                        if(rep.billable_minutes != null){
                            ukey[uid].meta.totals.work = ukey[uid].meta.totals.work + rep.billable_minutes;
                        }
                    }else if(rep.clock_type == 'PTO'){
                        if(rep.billable_minutes != null){
                            ukey[uid].meta.totals.pto = ukey[uid].meta.totals.pto + rep.billable_minutes;
                        }
                    }else if(rep.clock_type == 'UPTO'){
                        if(rep.billable_minutes != null){
                            ukey[uid].meta.totals.upto = ukey[uid].meta.totals.upto + rep.billable_minutes;
                        }
                    }else{
                        if(rep.billable_minutes != null){
                            ukey[uid].meta.totals.admin = ukey[uid].meta.totals.admin + rep.billable_minutes;
                        }
                    }
                    console.log(ukey[uid]); 
                }else{
                    // This is a break entry for this user
                    var breakObj = {
                        breakStart: rep.start_time,
                        breakEnd: rep.end_time,
                        breakMins: rep.minutes_on_break
                    };
                    ukey[uid].detail[mostRecentRecIndex].breaks.push(breakObj);
                }
            });

            console.log(ukey);
            // Probably should have used .map here, but w/e
            var ukeyKeys = _.keys(ukey);
            ukeyKeys.forEach((k)=>{
                packed.reports.push(ukey[k]);
            });
            result.setStatus(200);
            result.setPayload(packed);
            res.status(result.getStatus()).type('application/json').send(result.getPayload());
            timer.endTimer(result);
        }

        function failedQuery(failure){
            console.log("Failure Called")
            if(failure.error){
                result.setStatus(500);
                result.addError("An Error Has Occured E100");
                res.status(result.getStatus()).type('application/json').send(result.getPayload());
                timer.endTimer(result);
            }else{
                console.log(failure.result)
                result.setStatus(500);
                result.addError("An Error Has Occured E100");
                res.status(result.getStatus()).type('application/json').send(result.getPayload());
                timer.endTimer(result);
            }
        }
    }else{
        // Can Go No Further Will Error Filled Garbage
        res.status(result.getStatus()).type('application/json').send(result.getPayload());
        timer.endTimer(result);
    }
});

// timestamps always in format: YYYY-MM-DD HH24:MM:SS
// Date always in format: YYYY-MM-DD
// Times will be returned as HH12:MM AM/PM
/*
var report_response_format = {
    period_start: 'period start timestamp',
    period_end: 'period end timestamp',
    reports:[ // 0 or more
        { 
            meta: {
                userID: 'id',
                fullName: 'full_name',
                totals: {
                    work: #ofmins,
                    pto: #ofmins,
                    upto: #ofmins,
                    admin: #ofmins
                }
            },
            detail: [ // 0 or more
                {
                    date: 'detail item date',
					type: 'WORK / PTO / UPTO / ADMIN',
                    clockIn: 'clock in time',
                    clockOut: 'clock out time',
                    billableMins: '# of billable minutes',
                    breakTotalMins: '# of break minutes',
                    breaks: [ // 0 or more
                        {
                            breakStart: 'break start time',
                            breakEnd: 'break end time',
                            breakMins: 'length of break in minutes'
                        }
                    ]

                }
            ]
        }   
        
    ]
}
*/

// // Get all timesheets
// router.get('/timesheets', function (req, res) {
//     // Get Timer and Result Builder
//     var {timer, result} = initializeRoute(req);

//     var userID = req.user.id;

//     var page = 0;
//     var perPage = 24;

//     if(_.has(req.query, 'perpage')){
//         perPage = parseInt(req.query.perpage);
//     }

//     if(_.has(req.query, 'page')){
//         page = parseInt(req.query.page);
//     }

//     var meta = {};
    
// });


// // Searching through Timesheets
// router.post('/timesheets/search', function (req, res) {

//     // get timer and result builder
//     var {timer, result} = initializeRoute(req);

//     log.info("Searching...")
//     console.log(req.params)

//     // get user id
//     var userID = req.user.id;

//     // get json body
//     var body = req.body;

// });

// // Get Single Timesheet
// router.get('/timesheets/:id', function (req, res) {
//     // Get Timer and Result Builder
//     var {timer, result} = initializeRoute(req);

//     var userID = req.user.id;

//     // Validation of Request id parameter before use
//     if ( !(_.has(req.params, "id")) || req.params.id == null || req.params.id == undefined){

//         result.setStatus(400);
//         result.addError("Request Requires Parameter id to be filled");
//         result.setPayload({});
//         res.status(result.getStatus()).type('application/json').send(result.getPayload());
//         timer.endTimer(result);
//         return;
//     }

// });

// // Edit the specific Contact
// router.put('/timesheets/:id', function(req, res){

//     var {timer, result} = initializeRoute(req);
//     var userID = req.user.id;

//     log.info("Editing Contact")
//     console.log(req.params);


//     // json body of the request...
//     var clientRequest = req.body;

//     // Validation of Request id parameter before use
//     if ( !(_.has(req.params, "id")) || req.params.id == null || req.params.id == undefined){

//         result.setStatus(400);
//         result.addError("Request Requires Parameter id to be filled");
//         result.setPayload({});
//         res.status(result.getStatus()).type('application/json').send(result.getPayload());
//         timer.endTimer(result);
//         return;
//     }
// });


// // Deletes the specific timesheet
// router.delete('/timesheets/:id', function(req, res){

//     var {timer, result} = initializeRoute(req);
//     var userID = req.user.id;

//     if ( !(_.has(req.params, "id")) || req.params.id == null || req.params.id == undefined){

//         result.setStatus(400);
//         result.addError("Request Requires Parameter id to be filled");
//         result.setPayload({});
//         res.status(result.getStatus()).type('application/json').send(result.getPayload());
//         timer.endTimer(result);
//         return;
//     }
//     var paramID = req.params.id;
// });


// Actual Endpoints - END


module.exports = router;
