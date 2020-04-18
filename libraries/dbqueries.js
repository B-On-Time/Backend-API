const select = {
    listContacts(pool, user, successCallback, failureCallback){
        const query = {
            account_and_id_set: ';SET LOCAL loc.user_id=\'' + user.id + '\'',
            text: 'SELECT id, added_on, last_modified, active, first_name, middle_name, last_name, nick_name FROM cardoon.contacts WHERE user_id=current_setting(\'loc.user_id\')::UUID'
        };
        performQuery_noValues(pool, query, successCallback, failureCallback);
    }
};

const insert = {

};

const auth = {
    getLogin(pool, values, successCallback, failureCallback){
        const query = {
            text: 'SELECT users.id, users.first_name, users.last_name, auth.pass FROM public.users LEFT JOIN public.auth ON auth.user_id = users.id WHERE users.email = $1::TEXT',
            values: values
        };
        performQuery_withValues_noLocal(pool, query, successCallback, failureCallback);
    },
    createAccount(pool, values, successCallback, failureCallback){
        const query = {
            text: 'INSERT INTO auth.users (first_name, last_name, email, username, hash, rounds) VALUES($1::TEXT, $2::TEXT, $3::TEXT, $4::TEXT, $5::TEXT, 10::BIGINT)',
            values: values
        };
        //console.log(successCallback)
        //console.log(failureCallback)
        performQuery_withValues_noLocal(pool, query, successCallback, failureCallback);
    },
    getAPIKey(pool, key, successCallback, failureCallback){
        const query = {
            text: "SELECT id FROM auth.api_keys WHERE key = '" + key + "'::UUID;",
            //values: [key]
        }
        console.log(query);
        performQuery_noValues(pool, query, successCallback, failureCallback);
    }
};

const clock = {
    in(pool, userID, values, successCallback, failureCallback){
        const query = {
            setRole: 'SET ROLE \'' + userID + '\'',
            text: 'SELECT clock_in as punch_event_id FROM clock_in($1::uuid, $2::date, $3::time, $4::punch_types, $5::text)',
            //lookup_user_id, lookup_event_date, entry_time, lookup_punch_type, passed_notes
            values: values
        };
        performQueryAsRole_withValues(pool, query, successCallback, failureCallback);
    },
    out(pool, userID, values, successCallback, failureCallback){
        const query = {
            setRole: 'SET ROLE \'' + userID + '\'',
            text: 'SELECT clock_out as punch_event_id FROM clock_out($1::uuid, $2::date, $3::time, $4::punch_types, $5::text)',
            //lookup_user_id, lookup_event_date, entry_time, lookup_punch_type, passed_notes
            values: values
        };
        performQueryAsRole_withValues(pool, query, successCallback, failureCallback);
    },
    status(pool, userID, lookup_user_id, pg_timestamp, successCallback, failureCallback){
        const query = {
            setRole: 'SET LOCAL loc.seek_time = \'' + pg_timestamp + '\'; SET LOCAL loc.seek_user = \'' + lookup_user_id + '\';SET ROLE \'' + userID + '\'',
            text: 'SELECT * FROM check_status'
        };
        performQueryAsRole_withValues(pool, query, successCallback, failureCallback);
    },
};

const clockBreak = {
    start(pool, userID, values, successCallback, failureCallback){
        const query = {
            setRole: 'SET ROLE \'' + userID + '\'',
            text: 'SELECT break_in as punch_event_id FROM break_in($1::uuid, $2::date, $3::time, $4::punch_types, $5::text)',
            //lookup_user_id, lookup_event_date, entry_time, lookup_punch_type, passed_notes
            values: values
        };
        performQueryAsRole_withValues(pool, query, successCallback, failureCallback);
    },
    end(pool, userID, values, successCallback, failureCallback){
        const query = {
            setRole: 'SET ROLE \'' + userID + '\'',
            text: 'SELECT break_out as punch_event_id FROM break_out($1::uuid, $2::date, $3::time, $4::punch_types, $5::text)',
            //lookup_user_id, lookup_event_date, entry_time, lookup_punch_type, passed_notes
            values: values
        };
        performQueryAsRole_withValues(pool, query, successCallback, failureCallback);
    },
}


// Actual Query Function
function performQueryAsRole_withValues(pool, query, successCallback, failureCallback){
    pool.connect((err, client, success, failure) => {
        const shouldAbort = err => {
            if (err) {
                //Error In Transaction
                console.error('Error in transaction')
                console.log(err);
                var reason;
                if( err.constraint == 'unq_users_email_and_username'){
                    reason = "USERNAME ALREADY EXISTS"
                }
                client.query('ROLLBACK', err => {
                    if (err) {
                        console.error('Error rolling back client', err.stack)
                        failureCallback({result: "TRANSACTION ROLLBACK FAILED",error: err});
                    }else{
                        //Failed Query Response Object
                        failureCallback({result: reason, error: err});
                    }
                    // release the client back to the pool
                    client.release();
                });
            }
            return !!err
        }
        
        client.query('BEGIN', err => {
            // Check For Errors
            if (shouldAbort(err)) return
            const setupLocals = query.setRole;

            client.query(setupLocals, (err, res) => {
                
                if (shouldAbort(err)) return

                const thework = query.text;
                const insertVals = query.values;
                client.query(thework, insertVals, (err, res) => {
                    // Check For Errors
                    if (shouldAbort(err)) return

                    client.query('COMMIT', err => {
                        if (err) {
                        console.error('Error committing transaction', err.stack)
                        failureCallback({result: "TRANSACTION COMMIT FAILED",error: err});
                        }
                        //returning
                        //console.log('returning' + res);
                        successCallback(res)
                        client.release();
                    })
                })

            })

        })
    });
}


function performQueryAsRole_noValues(pool, query, successCallback, failureCallback){
    pool.connect((err, client, success, failure) => {
        const shouldAbort = err => {
            if (err) {
                //Error In Transaction
                console.error('Error in transaction')
                console.log(err);
                var reason;
                if( err.constraint == 'unq_users_email_and_username'){
                    reason = "USERNAME ALREADY EXISTS"
                }
                client.query('ROLLBACK', err => {
                    if (err) {
                        console.error('Error rolling back client', err.stack)
                        failureCallback({result: "TRANSACTION ROLLBACK FAILED",error: err});
                    }else{
                        //Failed Query Response Object
                        failureCallback({result: reason, error: err});
                    }
                    // release the client back to the pool
                    client.release();
                });
            }
            return !!err
        }
        
        client.query('BEGIN', err => {
            // Check For Errors
            if (shouldAbort(err)) return
            const setupLocals = query.setRole;

            client.query(setupLocals, (err, res) => {
                
                if (shouldAbort(err)) return

                const thework = query.text;
                client.query(thework, (err, res) => {
                    // Check For Errors
                    if (shouldAbort(err)) return

                    client.query('COMMIT', err => {
                        if (err) {
                        console.error('Error committing transaction', err.stack)
                        failureCallback({result: "TRANSACTION COMMIT FAILED",error: err});
                        }
                        //returning
                        //console.log('returning' + res);
                        successCallback(res)
                        client.release();
                    })
                })

            })

        })
    });
}

function performQuery_withValues_noLocal(pool, query, successCallback, failureCallback){
    pool.connect((err, client, success, failure) => {
        const shouldAbort = err => {
            if (err) {
                //Error In Transaction
                console.error('Error in transaction')
                console.log(err);
                var reason;
                if( err.constraint == 'unq_users_email_and_username'){
                    reason = "USERNAME ALREADY EXISTS"
                }
                client.query('ROLLBACK', err => {
                    if (err) {
                        console.error('Error rolling back client', err.stack)
                        failureCallback({result: "TRANSACTION ROLLBACK FAILED",error: err});
                    }else{
                        //Failed Query Response Object
                        failureCallback({result: reason, error: err});
                    }
                    // release the client back to the pool
                    client.release();
                });
            }
            return !!err
        }
        client.query('BEGIN', err => {
            // Check For Errors
            if (shouldAbort(err)) return
            const thework = query.text;
            const insertVals = query.values;
            client.query(thework, insertVals, (err, res) => {
                // Check For Errors
                if (shouldAbort(err)) return

                client.query('COMMIT', err => {
                    if (err) {
                    console.error('Error committing transaction', err.stack)
                    failureCallback({result: "TRANSACTION COMMIT FAILED",error: err});
                    }
                    //returning
                    //console.log('returning' + res);
                    successCallback(res)
                    client.release();
                })
            })
        })
    });
}

function performQuery_noValues(pool, query, successCallback, failureCallback){
    pool.connect((err, client, success, failure) => {
        const shouldAbort = err => {
            if (err) {
                //Error In Transaction
                console.error('Error in transaction');
                console.log(err);
                client.query('ROLLBACK', err => {
                    if (err) {
                        console.error('Error rolling back client', err.stack)
                        failureCallback({result: "TRANSACTION ROLLBACK FAILED",error: err});
                    }else{
                        //Failed Query Response Object
                        failureCallback({result: "TRANSACTION ROLLBACK SUCCESSFUL",error: err});
                    }
                    // release the client back to the pool
                    client.release();
                });
            }
            return !!err
        }
        client.query('BEGIN', err => {
            // Check For Errors
            if (shouldAbort(err)) return
            const thework = query.text;
            client.query(thework, (err, res) => {
                // Check For Errors
                if (shouldAbort(err)) return

                client.query('COMMIT', err => {
                    if (err) {
                    console.error('Error committing transaction', err.stack)
                    failureCallback({result: "TRANSACTION COMMIT FAILED",error: err});
                    }
                    //returning
                    //console.log('returning' + res);
                    successCallback(res)
                    client.release();
                })
            })

        })
    });
}


// Export ES6 Style
module.exports = {
    select,
    insert,
    auth,
    clock,
    clockBreak,
};