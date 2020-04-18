const fs = require('fs');
const express = require('express');
const { Pool } = require('pg');
const bcrypt = require('bcryptjs');
var path = require('path');
const log = require('../libraries/logging.js');
var pwgen = require('generate-password');

// Pull Config File
var fullpath = path.join(__dirname, "config.json");
var initialize = path.join(__dirname, "init.sql");





if( fs.existsSync(fullpath) ){
    // File Exists
    try {
        var res = null;
        
        res = JSON.parse(fs.readFileSync(fullpath));
        // Load Success
        loadConfigFileCompleted(res)
    } catch (error) {
    // Load Failed
    
        log.critical("Unable To Load " + fullpath);
        console.log(error);
        throw new Error("FAILED TO LOAD " + fullpath + ": FILE EXISTS - ERROR DURRING READ");
    }
}else{
    // File Does Not Exist
    log.critical("Unable To Find Config File" + fullpath);
    throw new Error("FAILED TO LOAD " + fullpath + ": EXPECTING JSON FILE " + fullpath);
}

function loadConfigFileCompleted(config){
    // Open Connection To Postgres Database
    const pool = new Pool( config.pg );

    // the pool with emit an error on behalf of any idle clients
    // it contains if a backend error or network partition happens
    pool.on('error', (err, client) => {
        console.error('Unexpected error on idle client', err);
        process.exit(-1);
    });

    // Perform Initial Setup

    // Generate Password Our Rest API User
    var restUserPass = pwgen.generate({
        length: 60,
        numbers: true,
        lowercase: true,
        uppercase: true
    });
    console.log(restUserPass);

    const query = {
        text: 'ALTER USER "bontime_rest_api_data_user" PASSWORD $1;',
        values: [restUserPass]
    };

    processSQLFile(initialize);

    // Perform Update Of bontime_rest_api_data_user password
    try {
        const res = await pool.query(query.text, query.values)
    } catch (err) {
        console.log(err.stack)
    }

    // Build Postgres Config File
    var pgconfig = {
        host: "127.0.0.1",
        database: "bontime",
        user: "bontime_rest_api_data_user",
        password: restUserPass,
        port: 5433,
        max: 20
    }

    // Save This To A Configuration File
    var jsonStr = JSON.stringify({data: pgconfig});

    // Write File To Disk

    // Connect With This New Postgres Config
    // Open Connection To Postgres Database
    const pool = new Pool( config.pg );

    // the pool with emit an error on behalf of any idle clients
    // it contains if a backend error or network partition happens
    pool.on('error', (err, client) => {
        console.error('Unexpected error on idle client', err);
        process.exit(-1);
    });
}

function processSQLFile(fileName) {

    // Extract SQL queries from files. Assumes no ';' in the fileNames
    var queries = fs.readFileSync(fileName).toString()
      .replace(/(\r\n|\n|\r)/gm," ") // remove newlines
      .replace(/\s+/g, ' ') // excess white space
      .split(";") // split into all statements
      .map(Function.prototype.call, String.prototype.trim)
      .filter(function(el) {return el.length != 0}); // remove any empty ones
    
    queries.forEach((qtext)=>{
        try {
            const res = await pool.query(qtext)
            // { name: 'brianc', email: 'brian.m.carlson@gmail.com' }
        } catch (err) {
            console.log(err.stack)
        }
    })
    
    // Execute each SQL query sequentially
    // queries.forEach(function(query) {
    //   batch.push(function(done) {
    //     if (query.indexOf("COPY") === 0) { // COPY - needs special treatment
    //       var regexp = /COPY\ (.*)\ FROM\ (.*)\ DELIMITERS/gmi;
    //       var matches = regexp.exec(query);
    //       var table = matches[1];
    //       var fileName = matches[2];
    //       var copyString = "COPY " + table + " FROM STDIN DELIMITERS ',' CSV HEADER";
    //       var stream = client.copyFrom(copyString);
    //       stream.on('close', function () {
    //         done();
    //       });
    //       var csvFile = __dirname + '/' + fileName;
    //       var str = fs.readFileSync(csvFile);
    //       stream.write(str);
    //       stream.end();
    //     } else { // Other queries don't need special treatment
    //       client.query(query, function(result) {
    //         done();
    //       });
    //     }
    //   });
    // });
  }