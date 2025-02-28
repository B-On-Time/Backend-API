var assert = require('assert');
const fs = require('fs');
const log = require('../libraries/logging.js');
var path = require('path');

log.procedure("Loading Configuration Files");
console.log(__dirname);
var configs = [
    {
        human_name: "Database",
        key_name: 'dbconfig',
        type: "Config File",
        isJSON: true,
        assertHas: ['data'],
        file: path.join(__dirname, "db-connection.json")
    },
    {
      human_name: "RSA 4096 Private Key - JWT",
      key_name: 'jwtprivate',
      type: "Private Key",
      isJSON: false,
      assertHas: [],
      file: path.join(__dirname, "keys/jwt-rsa.private")
    },
    {
      human_name: "RSA 4096 Public Key - JWT",
      key_name: 'jwtpublic',
      type: "Public Key",
      isJSON: false,
      assertHas: [],
      file: path.join(__dirname, "keys/jwt-rsa.public")
    },
    {
      human_name: "Gmail - Password Verification And Reset Link Account",
      key_name: 'email',
      type: "Config File",
      isJSON: true,
      assertHas: ['email', 'password'],
      file: path.join(__dirname, "email.json")
    },
    {
      human_name: "Server Domain Names",
      key_name: 'domain',
      type: "Config File",
      isJSON: true,
      assertHas: ['web', 'api'],
      file: path.join(__dirname, "domain.json")
    }

];

var exp = {};
// Fetch All Listed Configs
configs.forEach((cfg)=>{
    exp[cfg.key_name] = getConfigItem(cfg);
    if(cfg.isJSON){
        // Check Assertions
        cfg.assertHas.forEach((asrt)=>{
        assert( asrt in exp[cfg.key_name], "Config Item: " + cfg.human_name + " " + cfg.type + " Lacks " + asrt + " key");
        })
    }
});

function getConfigItem(configObj){
    log.info("Load Config: " + configObj.human_name);
    var fullpath = configObj.file;
    if( fs.existsSync(fullpath) ){
        // File Exists
        try {
        var res = null;
        
        if(configObj.isJSON){
            res = JSON.parse(fs.readFileSync(fullpath));
        }else{
            res = fs.readFileSync(fullpath);
        }
        // Load Success
        return res;
        } catch (error) {
        // Load Failed
        
        log.critical("Unable To Load " + configObj.human_name + " " + configObj.type);
        log.critical("Looking at File Path: " + fullpath);
        console.log(error);
        throw new Error("FAILED TO LOAD " + configObj.human_name + " " + configObj.type + ": FILE EXISTS - ERROR DURRING READ");
        }
    }else{
        // File Does Not Exist
        log.critical("Unable To Find " + configObj.human_name + " " + configObj.type);
        log.critical("Looking at File Path: " + fullpath);
        throw new Error("FAILED TO LOAD " + configObj.human_name + " " + configObj.type + ": EXPECTING JSON FILE " + fullpath);
    }
}
  
  module.exports = exp;