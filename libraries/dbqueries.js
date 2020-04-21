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
    getKioskPinLogin(pool, values, successCallback, failureCallback){
        const query = {
            text: 'SELECT usr.id as user_id, usr.first_name, usr.middle_name, usr.last_name, auth.id as auth_id, auth.kiosk_pin FROM public.auth as auth LEFT JOIN public.users as usr ON usr.id = auth.user_id WHERE auth.kiosk_pin = $1',
            values: values
        };
        performQuery_withValues_noLocal(pool, query, successCallback, failureCallback);
    },
    setupKioskPin(pool, userID, values, successCallback, failureCallback){
        const query = {
            setRole: 'SET ROLE \'' + userID + '\'',
            text: 'SELECT upsert_kiosk_pin public.upsert_kiosk_pin($1)',
            //lookup_user_id
            values: values
        };
        performQueryAsRole_withValues(pool, query, successCallback, failureCallback);
    },
    getAPIKey(pool, key, successCallback, failureCallback){
        const query = {
            text: "SELECT id FROM auth.api_keys WHERE key = '" + key + "'::UUID;",
            //values: [key]
        }
        console.log(query);
        performQuery_noValues(pool, query, successCallback, failureCallback);
    },
    updatePass(pool, userID, values, successCallback, failureCallback){
        const query = {
            setRole: 'SET ROLE \'' + userID + '\'',
            text: 'UPDATE public.auth SET pass = $1 WHERE user_id = \'' + userID + '\'',
            //hashpass
            values: values
        };
        performQueryAsRole_withValues(pool, query, successCallback, failureCallback);
    },
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
            text: 'SELECT punch_id, punch_type, timesheet_id, event_date, clock_day::TEXT, punch_event_id, clock_time::TEXT, type, for_interval, current_status FROM check_status'
        };
        performQueryAsRole_withValues(pool, query, successCallback, failureCallback);
    },
    allUserStatuses(pool, userID, pg_timestamp, successCallback, failureCallback){
        const query = {
            setRole: 'SET LOCAL loc.seek_time = \'' + pg_timestamp + '\'; SET ROLE \'' + userID + '\'',
            text: 'SELECT aus.punch_id, u.id as user_id, CONCAT(u.first_name, \' \', u.last_name) as user_full_name, aus.punch_type, aus.timesheet_id, aus.event_date, aus.clock_day::TEXT, aus.punch_event_id, aus.clock_time::TEXT, aus.type, aus.for_interval, aus.current_status FROM public.get_all_user_statuses() as aus LEFT JOIN public.punches as p ON p.id = aus.punch_id LEFT JOIN public.users as u ON u.id = p.user_id'
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
};

const permissions = {
    list(pool, successCallback, failureCallback){
        const query = {
            text: 'SELECT perm.id, perm.created_by as created_by_id, CONCAT(usr_create.first_name, usr_create.last_name) as created_by, to_timestamp(perm.created_on) at time zone \'utc\' as created_on, perm.last_modified_by as last_modified_by_id, CONCAT(usr_last_mod.first_name, usr_last_mod.last_name) as last_modified_by, to_timestamp(perm.last_modified_on) at time zone \'utc\' as last_modified_on, name, description, app_login_web, app_login_app, app_login_kiosk, app_admin_add_user, app_admin_remove_user, app_access_reporting, app_perform_transactions, ts_use_admin_punch_types, ts_entry_view_own, ts_entry_view_team, ts_modify_own, ts_modify_team FROM public.permissions as perm LEFT JOIN public.users as usr_create ON usr_create.id = perm.created_by LEFT JOIN public.users as usr_last_mod ON usr_last_mod.id = perm.last_modified_by'
        };
        performQuery_withValues_noLocal(pool, query, successCallback, failureCallback);
    },
    userByRole(pool, userID, successCallback, failureCallback){
        const query = {
            setRole: 'SET ROLE \'' + userID + '\'',
            text: 'SELECT perm.id, perm.created_by as created_by_id, CONCAT(usr_create.first_name, usr_create.last_name) as created_by, to_timestamp(perm.created_on) at time zone \'utc\' as created_on, perm.last_modified_by as last_modified_by_id, CONCAT(usr_last_mod.first_name, usr_last_mod.last_name) as last_modified_by, to_timestamp(perm.last_modified_on) at time zone \'utc\' as last_modified_on, name, description, app_login_web, app_login_app, app_login_kiosk, app_admin_add_user, app_admin_remove_user, app_access_reporting, app_perform_transactions, ts_use_admin_punch_types, ts_entry_view_own, ts_entry_view_team, ts_modify_own, ts_modify_team FROM public.permissions as perm LEFT JOIN public.users as usr_create ON usr_create.id = perm.created_by LEFT JOIN public.users as usr_last_mod ON usr_last_mod.id = perm.last_modified_by WHERE perm.id = (SELECT permset FROM public.users WHERE id = (SELECT current_user)::UUID)'
        };
        performQueryAsRole_noValues(pool, query, successCallback, failureCallback);
    },
    userByID(pool, userID, successCallback, failureCallback){
        const query = {
            text: 'SELECT perm.id, perm.created_by as created_by_id, CONCAT(usr_create.first_name, usr_create.last_name) as created_by, to_timestamp(perm.created_on) at time zone \'utc\' as created_on, perm.last_modified_by as last_modified_by_id, CONCAT(usr_last_mod.first_name, usr_last_mod.last_name) as last_modified_by, to_timestamp(perm.last_modified_on) at time zone \'utc\' as last_modified_on, name, description, app_login_web, app_login_app, app_login_kiosk, app_admin_add_user, app_admin_remove_user, app_access_reporting, app_perform_transactions, ts_use_admin_punch_types, ts_entry_view_own, ts_entry_view_team, ts_modify_own, ts_modify_team FROM public.permissions as perm LEFT JOIN public.users as usr_create ON usr_create.id = perm.created_by LEFT JOIN public.users as usr_last_mod ON usr_last_mod.id = perm.last_modified_by WHERE perm.id = (SELECT permset FROM public.users WHERE id = $1::UUID)',
            values: [userID]
        };
        performQuery_withValues_noLocal(pool, query, successCallback, failureCallback);
    }
}

const user = {
    create(pool, userID, values, successCallback, failureCallback){
        const query = {
            setRole: 'SET ROLE \'' + userID + '\'',
            text: 'SELECT * FROM public.create_user($1::text, $2::text, $3::text, $4::text, \'{}\', $5::uuid, $6::text)',
            // first_name, middle_name, last_name, email, permission_set_id, bcrypt_hash
            values: values
        };
        performQueryAsRole_withValues(pool, query, successCallback, failureCallback);
    },
    verifyEmail(pool, verificationID, successCallback, failureCallback){
        const query = {
            text: 'SELECT verify_email FROM public.verify_email($1::UUID)',
            // lookup_user_id, lookup_event_date, entry_time, lookup_punch_type, passed_notes
            values: [verificationID]
        };
        performQuery_withValues_noLocal(pool, query, successCallback, failureCallback);
    },
    edit(pool, userID, values, successCallback, failureCallback){
        const query = {
            setRole: 'SET ROLE \'' + userID + '\'',
            text: 'UPDATE public.users SET permset=$1, email=$2, first_name=$3, middle_name=$4, last_name=$5 WHERE id = $6',
            // permset, email, first_name, middle_name, last_name, user_id
            values: values
        };
        performQueryAsRole_withValues(pool, query, successCallback, failureCallback);
    },
    view(pool, userID, values, successCallback, failureCallback){
        const query = {
            setRole: 'SET ROLE \'' + userID + '\'',
            text: 'SELECT usr.id as user_id, usr.created_by as created_by_id, CONCAT(usr_create.first_name, usr_create.last_name) as created_by, to_timestamp(usr.created_on) at time zone \'utc\' as created_on, usr.last_modified_by as last_modified_by_id, CONCAT(usr_last_mod.first_name, usr_last_mod.last_name) as last_modified_by, to_timestamp(usr.last_modified_on) at time zone \'utc\' as last_modified_on, usr.first_name, usr.middle_name, usr.last_name, usr.email FROM public.users as usr LEFT JOIN public.users as usr_create ON usr_create.id = usr.created_by LEFT JOIN public.users as usr_last_mod ON usr_last_mod.id = usr.last_modified_by WHERE usr.id = $1::UUID',
            // user_id
            values: values
        };
        performQueryAsRole_withValues(pool, query, successCallback, failureCallback);
    },
    list(pool, userID, successCallback, failureCallback){
        const query = {
            setRole: 'SET ROLE \'' + userID + '\'',
            text: 'SELECT usr.id as user_id, usr.created_by as created_by_id, CONCAT(usr_create.first_name, usr_create.last_name) as created_by, to_timestamp(usr.created_on) at time zone \'utc\' as created_on, usr.last_modified_by as last_modified_by_id, CONCAT(usr_last_mod.first_name, usr_last_mod.last_name) as last_modified_by, to_timestamp(usr.last_modified_on) at time zone \'utc\' as last_modified_on, usr.first_name, usr.middle_name, usr.last_name, usr.email FROM public.users as usr LEFT JOIN public.users as usr_create ON usr_create.id = usr.created_by LEFT JOIN public.users as usr_last_mod ON usr_last_mod.id = usr.last_modified_by',
        };
        performQueryAsRole_noValues(pool, query, successCallback, failureCallback);
    },    
};

const reporting = {
    multi(pool, userID, values, successCallback, failureCallback){
        const query = {
            setRole: 'SET ROLE \'' + userID + '\'',
            text: 'WITH report_punches as ( SELECT * FROM public.report_punches_for_list_of_users($1::UUID[], $2::DATE, $3::DATE) as rp) SELECT rp.clock_day::TEXT,rp.user_id,CONCAT(usr.first_name, \' \', usr.last_name) as user_full_name,rp.notice,rp.clock_type,rp.start_time,rp.end_time,rp.raw_minutes,rp.minutes_on_break,rp.billable_minutes FROM report_punches as rp LEFT JOIN public.users as usr ON usr.id = rp.user_id',
            // array of user_ids, start_date, end_date
            values: values
        };
        performQueryAsRole_withValues(pool, query, successCallback, failureCallback);
    },
    all(pool, userID, values, successCallback, failureCallback){
        const query = {
            setRole: 'SET ROLE \'' + userID + '\'',
            text: 'WITH report_punches as ( SELECT * FROM public.report_punches_for_all_users($1::DATE, $2::DATE) as rp) SELECT rp.clock_day::TEXT,rp.user_id,CONCAT(usr.first_name, \' \', usr.last_name) as user_full_name,rp.notice,rp.clock_type,rp.start_time,rp.end_time,rp.raw_minutes,rp.minutes_on_break,rp.billable_minutes FROM report_punches as rp LEFT JOIN public.users as usr ON usr.id = rp.user_id',
            // start_date, end_date
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
                if( err.constraint == 'users_email_key'){
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
    permissions,
    user,
    reporting,
};