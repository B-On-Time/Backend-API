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
    // userId
    // eventDate
    // entryTime
    // punchType
    // notes

    // Check if User Currently Clocked In
    db.clock.status(pool, userID, body.userId, pgTimeStamp, completedStatusQuery, failedStatusQuery);

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
            var values = [body.userId, body.eventDate, body.entryTime, body.punchType, body.notes];

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

    // Check if User Currently Clocked In
    db.clock.status(pool, userID, body.userId, pgTimeStamp, completedStatusQuery, failedStatusQuery);

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
            var values = [body.userId, body.eventDate, body.entryTime, body.punchType, body.notes];

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

    // Check if User Currently Clocked In
    db.clock.status(pool, userID, body.userId, pgTimeStamp, completedStatusQuery, failedStatusQuery);

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
            var values = [body.userId, body.eventDate, body.entryTime, body.punchType, body.notes];

            db.break.in(pool, userID, values, completedQuery, failedQuery);

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
    db.clock.status(pool, userID, body.userId, pgTimeStamp, completedStatusQuery, failedStatusQuery);

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
            var values = [body.userId, body.eventDate, body.entryTime, body.punchType, body.notes];

            db.break.out(pool, userID, values, completedQuery, failedQuery);

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



// Get all timesheets
router.get('/timesheets', function (req, res) {
    // Get Timer and Result Builder
    var {timer, result} = initializeRoute(req);

    var userID = req.user.id;

    var page = 0;
    var perPage = 24;

    if(_.has(req.query, 'perpage')){
        perPage = parseInt(req.query.perpage);
    }

    if(_.has(req.query, 'page')){
        page = parseInt(req.query.page);
    }

    var meta = {};
    
});


// Searching through Timesheets
router.post('/timesheets/search', function (req, res) {

    // get timer and result builder
    var {timer, result} = initializeRoute(req);

    log.info("Searching...")
    console.log(req.params)

    // get user id
    var userID = req.user.id;

    // get json body
    var body = req.body;

});

// Get Single Timesheet
router.get('/timesheets/:id', function (req, res) {
    // Get Timer and Result Builder
    var {timer, result} = initializeRoute(req);

    var userID = req.user.id;

    // Validation of Request id parameter before use
    if ( !(_.has(req.params, "id")) || req.params.id == null || req.params.id == undefined){

        result.setStatus(400);
        result.addError("Request Requires Parameter id to be filled");
        result.setPayload({});
        res.status(result.getStatus()).type('application/json').send(result.getPayload());
        timer.endTimer(result);
        return;
    }

});

// Edit the specific Contact
router.put('/timesheets/:id', function(req, res){

    var {timer, result} = initializeRoute(req);
    var userID = req.user.id;

    log.info("Editing Contact")
    console.log(req.params);


    // json body of the request...
    var clientRequest = req.body;

    // Validation of Request id parameter before use
    if ( !(_.has(req.params, "id")) || req.params.id == null || req.params.id == undefined){

        result.setStatus(400);
        result.addError("Request Requires Parameter id to be filled");
        result.setPayload({});
        res.status(result.getStatus()).type('application/json').send(result.getPayload());
        timer.endTimer(result);
        return;
    }
});


// Deletes the specific timesheet
router.delete('/timesheets/:id', function(req, res){

    var {timer, result} = initializeRoute(req);
    var userID = req.user.id;

    if ( !(_.has(req.params, "id")) || req.params.id == null || req.params.id == undefined){

        result.setStatus(400);
        result.addError("Request Requires Parameter id to be filled");
        result.setPayload({});
        res.status(result.getStatus()).type('application/json').send(result.getPayload());
        timer.endTimer(result);
        return;
    }
    var paramID = req.params.id;
});


// Actual Endpoints - END


module.exports = router;
