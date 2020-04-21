### Prerequisites

Install Node.js

Install PostgreSQL (Version 9.6 or newer)

Create Postgres User With The Following Privileges

- Can Login
- Create Roles
- Inherit Rights From Parent Roles

Create a new database owned by the new user you created

### Manual Setup Steps

Run The First Part of The script:

```sql
-- Add Required Extentions
CREATE EXTENSION "uuid-ossp" SCHEMA public;

-- Setup Rest API users

-- Create Role Group
CREATE ROLE "bontime_users" WITH NOLOGIN NOSUPERUSER INHERIT NOCREATEDB NOCREATEROLE NOREPLICATION;
  
ALTER DEFAULT PRIVILEGES IN SCHEMA public
GRANT ALL ON TABLES TO "bontime_users";

ALTER DEFAULT PRIVILEGES IN SCHEMA public
GRANT ALL ON SEQUENCES TO "bontime_users";

ALTER DEFAULT PRIVILEGES IN SCHEMA public
GRANT EXECUTE ON FUNCTIONS TO "bontime_users";

ALTER DEFAULT PRIVILEGES IN SCHEMA public
GRANT USAGE ON TYPES TO "bontime_users";

-- Create Rest API User
CREATE USER "bontime_rest_api_data_user" WITH
  LOGIN
  NOSUPERUSER
  INHERIT
  CREATEDB
  CREATEROLE
  REPLICATION;

-- Change API User Password
ALTER USER "bontime_rest_api_data_user" PASSWORD 'todo-generate-secure-password';
ALTER USER "bontime_rest_api_data_user" CONNECTION LIMIT 100;
GRANT "bontime_users" TO "bontime_rest_api_data_user" WITH ADMIN OPTION;

ALTER SCHEMA public OWNER TO "bontime_rest_api_data_user";

ALTER DEFAULT PRIVILEGES IN SCHEMA public
GRANT ALL ON TABLES TO "bontime_rest_api_data_user";

ALTER DEFAULT PRIVILEGES IN SCHEMA public
GRANT ALL ON SEQUENCES TO "bontime_rest_api_data_user";

ALTER DEFAULT PRIVILEGES IN SCHEMA public
GRANT EXECUTE ON FUNCTIONS TO "bontime_rest_api_data_user";

ALTER DEFAULT PRIVILEGES IN SCHEMA public
GRANT USAGE ON TYPES TO "bontime_rest_api_data_user";
```



Then Switch To A Connection To PostgreSQL from the user `bontime_rest_api_data_user` with the password provided in the script.



Then Run This Script

```sql
-- PROCEDURE: Change PG Connection Info To use New User

-- TODO: Somehow SETUP Email Account
-- Also Require User Sets Up https://myaccount.google.com/lesssecureapps allow less secure apps



-- Create User Table
CREATE TABLE public.users
(
    id uuid NOT NULL DEFAULT uuid_generate_v4(),
    created_by uuid,
	created_on double precision DEFAULT extract(epoch from now() at time zone 'utc'),
	last_modified_by uuid,
	last_modified_on double precision DEFAULT extract(epoch from now() at time zone 'utc'),
	teams uuid[] DEFAULT '{}'::UUID[],
	permset uuid,
	email text NOT NULL UNIQUE,
	first_name text,
	middle_name text,
	last_name text,
    PRIMARY KEY (id)
);

-- Ensure That User Is Created
CREATE OR REPLACE FUNCTION public.pg_user_gen_on_user_insert()
    RETURNS trigger
    LANGUAGE 'plpgsql'
    COST 100
    VOLATILE NOT LEAKPROOF SECURITY DEFINER 
    SET search_path='public'
AS $BODY$
    DECLARE
        v_old_data TEXT;
    BEGIN
        -- Validate Some Things
        IF TG_WHEN <> 'AFTER' THEN
            RAISE EXCEPTION 'pg_user_gen_on_user_insert() may only run as an AFTER trigger';
        END IF;
		EXECUTE CONCAT('CREATE ROLE "', NEW.id,'" WITH NOLOGIN NOSUPERUSER NOCREATEDB NOCREATEROLE INHERIT NOREPLICATION CONNECTION LIMIT -1;');
		EXECUTE CONCAT('GRANT bontime_users TO"', NEW.id,'";');
		EXECUTE CONCAT('GRANT "', NEW.id, '" TO "bontime_rest_api_data_user" WITH ADMIN OPTION;');
		RETURN NEW;
    
    EXCEPTION
        WHEN data_exception THEN
            RAISE EXCEPTION '[pg_user_gen_on_user_insert] - UDF ERROR [DATA EXCEPTION] - SQLSTATE: %, SQLERRM: %',SQLSTATE,SQLERRM;
            RETURN NULL;
        WHEN unique_violation THEN
            RAISE EXCEPTION '[pg_user_gen_on_user_insert] - UDF ERROR [UNIQUE] - SQLSTATE: %, SQLERRM: %',SQLSTATE,SQLERRM;
            RETURN NULL;
        WHEN OTHERS THEN
            RAISE EXCEPTION '[pg_user_gen_on_user_insert] - UDF ERROR [OTHER] - SQLSTATE: %, SQLERRM: %',SQLSTATE,SQLERRM;
            RETURN NULL;
    END;
    $BODY$;

CREATE TRIGGER generate_pg_user_on_user_insert AFTER INSERT ON public.users
	FOR EACH ROW
	EXECUTE PROCEDURE public.pg_user_gen_on_user_insert();

CREATE OR REPLACE FUNCTION public.pg_user_drop_on_user_delete()
    RETURNS trigger
    LANGUAGE 'plpgsql'
    COST 100
    VOLATILE NOT LEAKPROOF SECURITY DEFINER 
    SET search_path='public'
AS $BODY$
    DECLARE
        v_old_data TEXT;
    BEGIN
        -- Validate Some Things
        IF TG_WHEN <> 'BEFORE' THEN
            RAISE EXCEPTION 'pg_user_drop_on_user_delete() may only run as a BEFORE trigger';
        END IF;
		EXECUTE CONCAT('DROP ROLE "', OLD.id,'";');
		RETURN OLD;
    
    EXCEPTION
        WHEN data_exception THEN
            RAISE EXCEPTION '[pg_user_drop_on_user_delete] - UDF ERROR [DATA EXCEPTION] - SQLSTATE: %, SQLERRM: %',SQLSTATE,SQLERRM;
            RETURN NULL;
        WHEN unique_violation THEN
            RAISE EXCEPTION '[pg_user_drop_on_user_delete] - UDF ERROR [UNIQUE] - SQLSTATE: %, SQLERRM: %',SQLSTATE,SQLERRM;
            RETURN NULL;
        WHEN OTHERS THEN
            RAISE EXCEPTION '[pg_user_drop_on_user_delete] - UDF ERROR [OTHER] - SQLSTATE: %, SQLERRM: %',SQLSTATE,SQLERRM;
            RETURN NULL;
    END;
    $BODY$;

CREATE TRIGGER drop_pg_user_on_user_delete BEFORE DELETE ON public.users
	FOR EACH ROW
	EXECUTE PROCEDURE public.pg_user_drop_on_user_delete();

-- Modify Table
ALTER TABLE public.users ALTER COLUMN created_by SET NOT NULL;
ALTER TABLE public.users ALTER COLUMN last_modified_by SET NOT NULL;

-- Set Constraints
ALTER TABLE public.users
    ADD CONSTRAINT created_by_must_be_valid_user FOREIGN KEY (created_by)
    REFERENCES public.users (id) MATCH SIMPLE
    ON UPDATE NO ACTION
    ON DELETE NO ACTION;
CREATE INDEX fki_created_by_must_be_valid_user
    ON public.users(created_by);

ALTER TABLE public.users
    ADD CONSTRAINT last_modified_by_id_must_be_valid_user FOREIGN KEY (last_modified_by)
    REFERENCES public.users (id) MATCH SIMPLE
    ON UPDATE NO ACTION
    ON DELETE NO ACTION;
CREATE INDEX fki_last_modified_by_id_must_be_valid_user
    ON public.users(last_modified_by);

-- Create Default User
INSERT INTO public.users(
	id, created_by, last_modified_by, email, first_name, middle_name, last_name)
	VALUES ('70c505eb-6671-47e6-a8a7-9d7d7fccf2b6', '70c505eb-6671-47e6-a8a7-9d7d7fccf2b6', '70c505eb-6671-47e6-a8a7-9d7d7fccf2b6', 'Administrator', 'Default Admin', '', 'User');

-- TODO: Create Authentication Table
-- Create Auth Table
CREATE TABLE public.auth
(
    id uuid NOT NULL DEFAULT uuid_generate_v4(),
    created_by uuid,
	created_on double precision DEFAULT extract(epoch from now() at time zone 'utc'),
	last_modified_by uuid,
	last_modified_on double precision DEFAULT extract(epoch from now() at time zone 'utc'),
	user_id uuid NOT NULL,
	expires double precision DEFAULT extract(epoch from (now() + interval '24 hours') at time zone 'utc'),
	pass text,
	api_key text,
    PRIMARY KEY (id)
);

-- Set Constraints
ALTER TABLE public.auth
    ADD CONSTRAINT created_by_must_be_valid_user FOREIGN KEY (created_by)
    REFERENCES public.users (id) MATCH SIMPLE
    ON UPDATE NO ACTION
    ON DELETE NO ACTION;
CREATE INDEX fki_auth_created_by_must_be_valid_user
    ON public.auth(created_by);

ALTER TABLE public.auth
    ADD CONSTRAINT last_modified_by_id_must_be_valid_user FOREIGN KEY (last_modified_by)
    REFERENCES public.users (id) MATCH SIMPLE
    ON UPDATE NO ACTION
    ON DELETE NO ACTION;
CREATE INDEX fki_auth_last_modified_by_id_must_be_valid_user
    ON public.auth(last_modified_by);
	
ALTER TABLE public.auth
    ADD CONSTRAINT user_id_must_be_valid_user FOREIGN KEY (user_id)
    REFERENCES public.users (id) MATCH SIMPLE
    ON UPDATE NO ACTION
    ON DELETE NO ACTION;
CREATE INDEX fki_auth_user_id_must_be_valid_user
    ON public.auth(user_id);

-- Email Verification Table
CREATE TABLE public.email_verification
(
	id uuid NOT NULL DEFAULT uuid_generate_v4(),
	user_id uuid NOT NULL,
	expires double precision DEFAULT extract(epoch from (now() + interval '24 hours') at time zone 'utc'),
	verified boolean DEFAULT false,
	PRIMARY KEY (id)
);

ALTER TABLE public.email_verification
    ADD CONSTRAINT user_id_must_be_valid_user FOREIGN KEY (user_id)
    REFERENCES public.users (id) MATCH SIMPLE
    ON UPDATE NO ACTION
    ON DELETE NO ACTION;
CREATE INDEX fki_email_verification_user_id_must_be_valid_user
    ON public.email_verification(user_id);

-- Add Email Verified To Admin
INSERT INTO public.email_verification(user_id, verified) VALUES ('70c505eb-6671-47e6-a8a7-9d7d7fccf2b6', true);

-- Password Reset Table
CREATE TABLE public.password_reset
(
	id uuid NOT NULL DEFAULT uuid_generate_v4(),
	user_id uuid NOT NULL,
	expires double precision DEFAULT extract(epoch from (now() + interval '4 hours') at time zone 'utc'),
	used boolean DEFAULT false,
	PRIMARY KEY (id)
);

ALTER TABLE public.password_reset
    ADD CONSTRAINT user_id_must_be_valid_user FOREIGN KEY (user_id)
    REFERENCES public.users (id) MATCH SIMPLE
    ON UPDATE NO ACTION
    ON DELETE NO ACTION;
CREATE INDEX fki_password_reset_user_id_must_be_valid_user
    ON public.password_reset(user_id);

-- Create Teams Table
CREATE TABLE public.teams
(
    id uuid NOT NULL DEFAULT uuid_generate_v4(),
    created_by uuid NOT NULL,
	created_on double precision DEFAULT extract(epoch from now() at time zone 'utc'),
	last_modified_by uuid NOT NULL,
	last_modified_on double precision DEFAULT extract(epoch from now() at time zone 'utc'),
	editable boolean NOT NULL DEFAULT TRUE, 
	name text NOT NULL,
	description text,
	managers uuid[] NOT NULL DEFAULT '{70c505eb-6671-47e6-a8a7-9d7d7fccf2b6}',
    PRIMARY KEY (id)
);

ALTER TABLE public.teams
    ADD CONSTRAINT created_by_must_be_valid_user FOREIGN KEY (created_by)
    REFERENCES public.users (id) MATCH SIMPLE
    ON UPDATE NO ACTION
    ON DELETE NO ACTION;
CREATE INDEX fki_teams_created_by_must_be_valid_user
    ON public.teams(created_by);

ALTER TABLE public.teams
    ADD CONSTRAINT last_modified_by_id_must_be_valid_user FOREIGN KEY (last_modified_by)
    REFERENCES public.users (id) MATCH SIMPLE
    ON UPDATE NO ACTION
    ON DELETE NO ACTION;
CREATE INDEX fki_teams_last_modified_by_id_must_be_valid_user
    ON public.teams(last_modified_by);

-- Ensure That Administrator Is ALWAYS added to team managers
CREATE OR REPLACE FUNCTION public.enforce_admin_is_manager_for_all_teams()
    RETURNS trigger
    LANGUAGE 'plpgsql'
    COST 100
    VOLATILE NOT LEAKPROOF SECURITY DEFINER 
    SET search_path='public'
AS $BODY$
    DECLARE
        v_old_data TEXT;
    BEGIN
        -- Validate Some Things
        IF TG_WHEN <> 'BEFORE' THEN
            RAISE EXCEPTION 'enforce_admin_is_manager_for_all_teams() may only run as a BEFORE trigger';
        END IF;
		IF NOT('70c505eb-6671-47e6-a8a7-9d7d7fccf2b6' = ANY(NEW.managers)) THEN
			NEW.managers := array_append(NEW.managers, '70c505eb-6671-47e6-a8a7-9d7d7fccf2b6');
		END IF;
		RETURN NEW;
    
    EXCEPTION
        WHEN data_exception THEN
            RAISE EXCEPTION '[enforce_admin_is_manager_for_all_teams] - UDF ERROR [DATA EXCEPTION] - SQLSTATE: %, SQLERRM: %',SQLSTATE,SQLERRM;
            RETURN NULL;
        WHEN unique_violation THEN
            RAISE EXCEPTION '[enforce_admin_is_manager_for_all_teams] - UDF ERROR [UNIQUE] - SQLSTATE: %, SQLERRM: %',SQLSTATE,SQLERRM;
            RETURN NULL;
        WHEN OTHERS THEN
            RAISE EXCEPTION '[enforce_admin_is_manager_for_all_teams] - UDF ERROR [OTHER] - SQLSTATE: %, SQLERRM: %',SQLSTATE,SQLERRM;
            RETURN NULL;
    END;
    $BODY$;
	
CREATE TRIGGER enforce_admin_is_manager_for_all_teams_insert BEFORE INSERT ON public.teams
	FOR EACH ROW
	EXECUTE PROCEDURE public.enforce_admin_is_manager_for_all_teams();
	
CREATE TRIGGER enforce_admin_is_manager_for_all_teams_update BEFORE UPDATE ON public.teams
	FOR EACH ROW
	EXECUTE PROCEDURE public.enforce_admin_is_manager_for_all_teams();

-- SET USER DEFAULT TEAM
ALTER TABLE public.users ALTER COLUMN teams SET DEFAULT '{31ed22c5-27bd-4139-8e0d-20cd735b38bc}'::uuid[];

-- SET ADMIN TO DEFAULT TEAM
UPDATE public.users SET teams = '{31ed22c5-27bd-4139-8e0d-20cd735b38bc}'::uuid[];

-- Enforce Default Team For All users
CREATE OR REPLACE FUNCTION public.enforce_all_users_belong_to_default_team()
    RETURNS trigger
    LANGUAGE 'plpgsql'
    COST 100
    VOLATILE NOT LEAKPROOF SECURITY DEFINER 
    SET search_path='public'
AS $BODY$
    DECLARE
        v_old_data TEXT;
    BEGIN
        -- Validate Some Things
        IF TG_WHEN <> 'BEFORE' THEN
            RAISE EXCEPTION 'enforce_all_users_belong_to_default_team() may only run as a BEFORE trigger';
        END IF;
		IF NOT('31ed22c5-27bd-4139-8e0d-20cd735b38bc' = ANY(NEW.teams)) THEN
			NEW.teams := array_append(NEW.teams, '31ed22c5-27bd-4139-8e0d-20cd735b38bc');
		END IF;
		RETURN NEW;
    
    EXCEPTION
        WHEN data_exception THEN
            RAISE EXCEPTION '[enforce_all_users_belong_to_default_team] - UDF ERROR [DATA EXCEPTION] - SQLSTATE: %, SQLERRM: %',SQLSTATE,SQLERRM;
            RETURN NULL;
        WHEN unique_violation THEN
            RAISE EXCEPTION '[enforce_all_users_belong_to_default_team] - UDF ERROR [UNIQUE] - SQLSTATE: %, SQLERRM: %',SQLSTATE,SQLERRM;
            RETURN NULL;
        WHEN OTHERS THEN
            RAISE EXCEPTION '[enforce_all_users_belong_to_default_team] - UDF ERROR [OTHER] - SQLSTATE: %, SQLERRM: %',SQLSTATE,SQLERRM;
            RETURN NULL;
    END;
    $BODY$;
	
CREATE TRIGGER enforce_all_users_belong_to_default_team_insert BEFORE INSERT ON public.users
	FOR EACH ROW
	EXECUTE PROCEDURE public.enforce_all_users_belong_to_default_team();
	
CREATE TRIGGER enforce_all_users_belong_to_default_team_update BEFORE UPDATE ON public.users
	FOR EACH ROW
	EXECUTE PROCEDURE public.enforce_all_users_belong_to_default_team();

-- CREATE PERMISSIONS TABLE
CREATE TABLE public.permissions
(
    id uuid NOT NULL DEFAULT uuid_generate_v4(),
    created_by uuid,
	created_on double precision DEFAULT extract(epoch from now() at time zone 'utc'),
	last_modified_by uuid,
	last_modified_on double precision DEFAULT extract(epoch from now() at time zone 'utc'),
	name text NOT NULL,
	description text,
	app_login_web boolean NOT NULL,
	app_login_app boolean NOT NULL,
	app_login_kiosk boolean NOT NULL,
	app_admin_add_user boolean NOT NULL,
	app_admin_remove_user boolean NOT NULL,
	app_access_reporting boolean NOT NULL,
	app_perform_transactions boolean NOT NULL,
	ts_use_admin_punch_types boolean NOT NULL,
	ts_entry_view_own boolean NOT NULL,
	ts_entry_view_team boolean NOT NULL,
	ts_modify_own boolean NOT NULL,
	ts_modify_team boolean NOT NULL,
    PRIMARY KEY (id)
);

ALTER TABLE public.permissions
    ADD CONSTRAINT created_by_must_be_valid_user FOREIGN KEY (created_by)
    REFERENCES public.users (id) MATCH SIMPLE
    ON UPDATE NO ACTION
    ON DELETE NO ACTION;
CREATE INDEX fki_permissions_created_by_must_be_valid_user
    ON public.permissions(created_by);

ALTER TABLE public.permissions
    ADD CONSTRAINT last_modified_by_id_must_be_valid_user FOREIGN KEY (last_modified_by)
    REFERENCES public.users (id) MATCH SIMPLE
    ON UPDATE NO ACTION
    ON DELETE NO ACTION;
CREATE INDEX fki_permissions_last_modified_by_id_must_be_valid_user
    ON public.permissions(last_modified_by);

-- CREATE DEFAULT PERMISSION SETS
INSERT INTO public.permissions(
	id, created_by,last_modified_by, 
	name, description, 
	app_login_web, app_login_app, app_login_kiosk, 
	app_admin_add_user, app_admin_remove_user, app_access_reporting, app_perform_transactions, 
	ts_use_admin_punch_types, ts_entry_view_own, ts_entry_view_team, ts_modify_own, ts_modify_team)
	VALUES ('ab61d4d8-52df-4e05-8bbd-2899780154e6', '70c505eb-6671-47e6-a8a7-9d7d7fccf2b6', '70c505eb-6671-47e6-a8a7-9d7d7fccf2b6', 
			'Administrator', 'Complete Permissions Set, Can Perform All Actions', 
			true, true, true, 
			true, true, true, true, 
			true, true, true, true, true);

INSERT INTO public.permissions(
	id, created_by,last_modified_by, 
	name, description, 
	app_login_web, app_login_app, app_login_kiosk, 
	app_admin_add_user, app_admin_remove_user, app_access_reporting, app_perform_transactions, 
	ts_use_admin_punch_types, ts_entry_view_own, ts_entry_view_team, ts_modify_own, ts_modify_team)
	VALUES ('e040f730-3322-4443-a54f-d848c0841367', '70c505eb-6671-47e6-a8a7-9d7d7fccf2b6', '70c505eb-6671-47e6-a8a7-9d7d7fccf2b6', 
			'Manager', 'Standard Manager', 
			true, true, true, 
			false, false, false, false, 
			true, true, true, true, true);
			
INSERT INTO public.permissions(
	id, created_by,last_modified_by, 
	name, description, 
	app_login_web, app_login_app, app_login_kiosk, 
	app_admin_add_user, app_admin_remove_user, app_access_reporting, app_perform_transactions, 
	ts_use_admin_punch_types, ts_entry_view_own, ts_entry_view_team, ts_modify_own, ts_modify_team)
	VALUES ('c779a171-c434-4900-9c1c-3ea48e14368c', '70c505eb-6671-47e6-a8a7-9d7d7fccf2b6', '70c505eb-6671-47e6-a8a7-9d7d7fccf2b6', 
			'Employee', 'Standard Employee', 
			true, true, true, 
			false, false, false, false, 
			false, true, false, false, false);
			
INSERT INTO public.permissions(
	id, created_by,last_modified_by, 
	name, description, 
	app_login_web, app_login_app, app_login_kiosk, 
	app_admin_add_user, app_admin_remove_user, app_access_reporting, app_perform_transactions, 
	ts_use_admin_punch_types, ts_entry_view_own, ts_entry_view_team, ts_modify_own, ts_modify_team)
	VALUES ('94f39e19-ad44-4ee1-8400-8babb681a21a', '70c505eb-6671-47e6-a8a7-9d7d7fccf2b6', '70c505eb-6671-47e6-a8a7-9d7d7fccf2b6', 
			'Disabled', 'Disabled or Terminated Employees May Be Switched To This Role To Prevent Access', 
			false, false, false, 
			false, false, false, false, 
			false, false, false, false, false);

-- SET Default User Permission Set
UPDATE public.users SET permset = 'ab61d4d8-52df-4e05-8bbd-2899780154e6'::UUID WHERE id = '70c505eb-6671-47e6-a8a7-9d7d7fccf2b6'::UUID;

-- Set user permset (permission set) default to employee, set foreign key restriction
ALTER TABLE public.users ALTER COLUMN permset SET DEFAULT 'c779a171-c434-4900-9c1c-3ea48e14368c'::UUID;

ALTER TABLE public.users ALTER COLUMN permset SET NOT NULL;

ALTER TABLE public.users
    ADD CONSTRAINT permset_must_be_valid_permissions_id FOREIGN KEY (permset)
    REFERENCES public.permissions (id) MATCH SIMPLE
    ON UPDATE NO ACTION
    ON DELETE NO ACTION;
CREATE INDEX fki_users_permset_must_be_valid_permissions_id
    ON public.users(created_by);

-- CREATE On Update Triggers For Last Update By and Last Update On For Tables: users, teams, permissions
CREATE FUNCTION public.enforce_update_to_last_modified_by_and_on()
    RETURNS trigger
    LANGUAGE 'plpgsql'
    COST 100
    VOLATILE NOT LEAKPROOF SECURITY DEFINER 
    SET search_path='public'
AS $BODY$
    DECLARE
        v_old_data TEXT;
    BEGIN
        -- Validate Some Things
        IF TG_WHEN <> 'BEFORE' THEN
            RAISE EXCEPTION 'enforce_update_to_last_modified_by_and_on() may only run as a BEFORE trigger';
        END IF;
		
		IF (SELECT current_user) = 'bontime_rest_api_data_user' THEN
			NEW.last_modified_by := '70c505eb-6671-47e6-a8a7-9d7d7fccf2b6'::UUID;
		ELSE
			-- Whatever User That Current User Is
			NEW.last_modified_by := (SELECT id FROM public.users as usr WHERE usr.id = (SELECT current_user) );
		END IF;
		-- Always Update Last Modified On:
		NEW.last_modified_on := date_part('epoch'::text, timezone('utc'::text, now()));
		RETURN NEW;
    
    EXCEPTION
        WHEN data_exception THEN
            RAISE EXCEPTION '[enforce_update_to_last_modified_by_and_on] - UDF ERROR [DATA EXCEPTION] - SQLSTATE: %, SQLERRM: %',SQLSTATE,SQLERRM;
            RETURN NULL;
        WHEN unique_violation THEN
            RAISE EXCEPTION '[enforce_update_to_last_modified_by_and_on] - UDF ERROR [UNIQUE] - SQLSTATE: %, SQLERRM: %',SQLSTATE,SQLERRM;
            RETURN NULL;
        WHEN OTHERS THEN
            RAISE EXCEPTION '[enforce_update_to_last_modified_by_and_on] - UDF ERROR [OTHER] - SQLSTATE: %, SQLERRM: %',SQLSTATE,SQLERRM;
            RETURN NULL;
    END;
    $BODY$;

CREATE TRIGGER enforce_update_last_modified_users_insert BEFORE INSERT ON public.users
	FOR EACH ROW
	EXECUTE PROCEDURE public.enforce_update_to_last_modified_by_and_on();
	
CREATE TRIGGER enforce_update_last_modified_users_update BEFORE UPDATE ON public.users
	FOR EACH ROW
	EXECUTE PROCEDURE public.enforce_update_to_last_modified_by_and_on();
	
CREATE TRIGGER enforce_update_last_modified_teams_insert BEFORE INSERT ON public.teams
	FOR EACH ROW
	EXECUTE PROCEDURE public.enforce_update_to_last_modified_by_and_on();
	
CREATE TRIGGER enforce_update_last_modified_teams_update BEFORE UPDATE ON public.teams
	FOR EACH ROW
	EXECUTE PROCEDURE public.enforce_update_to_last_modified_by_and_on();

CREATE TRIGGER enforce_update_last_modified_permissions_insert BEFORE INSERT ON public.permissions
	FOR EACH ROW
	EXECUTE PROCEDURE public.enforce_update_to_last_modified_by_and_on();
	
CREATE TRIGGER enforce_update_last_modified_permissions_update BEFORE UPDATE ON public.permissions
	FOR EACH ROW
	EXECUTE PROCEDURE public.enforce_update_to_last_modified_by_and_on();

CREATE TRIGGER enforce_update_last_modified_auth_insert BEFORE INSERT ON public.auth
	FOR EACH ROW
	EXECUTE PROCEDURE public.enforce_update_to_last_modified_by_and_on();
	
CREATE TRIGGER enforce_update_last_modified_auth_update BEFORE UPDATE ON public.auth
	FOR EACH ROW
	EXECUTE PROCEDURE public.enforce_update_to_last_modified_by_and_on();

-- Users, Teams, and Permissions Setup is Completed...

-- Begin Setup For Timesheets
CREATE TABLE public.timesheets
(
    id uuid NOT NULL DEFAULT uuid_generate_v4(),
    created_by uuid,
	created_on double precision DEFAULT extract(epoch from now() at time zone 'utc'),
	last_modified_by uuid,
	last_modified_on double precision DEFAULT extract(epoch from now() at time zone 'utc'),
	start_date double precision,
	end_date double precision,
    PRIMARY KEY (id)
);

ALTER TABLE public.timesheets
    ADD CONSTRAINT created_by_must_be_valid_user FOREIGN KEY (created_by)
    REFERENCES public.users (id) MATCH SIMPLE
    ON UPDATE NO ACTION
    ON DELETE NO ACTION;
CREATE INDEX fki_timesheets_created_by_must_be_valid_user
    ON public.timesheets(created_by);

ALTER TABLE public.timesheets
    ADD CONSTRAINT last_modified_by_id_must_be_valid_user FOREIGN KEY (last_modified_by)
    REFERENCES public.users (id) MATCH SIMPLE
    ON UPDATE NO ACTION
    ON DELETE NO ACTION;
CREATE INDEX fki_timesheets_last_modified_by_id_must_be_valid_user
    ON public.timesheets(last_modified_by);
	
CREATE TRIGGER enforce_update_last_modified_timesheets_insert BEFORE INSERT ON public.timesheets
	FOR EACH ROW
	EXECUTE PROCEDURE public.enforce_update_to_last_modified_by_and_on();
	
CREATE TRIGGER enforce_update_last_modified_timesheets_update BEFORE UPDATE ON public.timesheets
	FOR EACH ROW
	EXECUTE PROCEDURE public.enforce_update_to_last_modified_by_and_on();

CREATE TYPE punch_types AS ENUM ('WORK', 'PTO', 'UPTO', 'ADMIN');
	
CREATE TABLE public.punches
(
    id uuid NOT NULL DEFAULT uuid_generate_v4(),
    created_by uuid,
	created_on double precision DEFAULT extract(epoch from now() at time zone 'utc'),
	last_modified_by uuid,
	last_modified_on double precision DEFAULT extract(epoch from now() at time zone 'utc'),
	edit_lock boolean NOT NULL DEFAULT false,
	edit_lock_reason text,
	punch_type punch_types NOT NULL,
	timesheet_id uuid,
	event_date double precision,
	user_id uuid NOT NULL,
    PRIMARY KEY (id)
);

ALTER TABLE public.punches
    ADD CONSTRAINT created_by_must_be_valid_user FOREIGN KEY (created_by)
    REFERENCES public.users (id) MATCH SIMPLE
    ON UPDATE NO ACTION
    ON DELETE NO ACTION;
CREATE INDEX fki_punches_created_by_must_be_valid_user
    ON public.punches(created_by);

ALTER TABLE public.punches
    ADD CONSTRAINT last_modified_by_id_must_be_valid_user FOREIGN KEY (last_modified_by)
    REFERENCES public.users (id) MATCH SIMPLE
    ON UPDATE NO ACTION
    ON DELETE NO ACTION;
CREATE INDEX fki_punches_last_modified_by_id_must_be_valid_user
    ON public.punches(last_modified_by);
	
ALTER TABLE public.punches
    ADD CONSTRAINT timesheet_id_in_punch_must_be_valid_timesheet FOREIGN KEY (timesheet_id)
    REFERENCES public.timesheets (id) MATCH SIMPLE
    ON UPDATE NO ACTION
    ON DELETE NO ACTION;
CREATE INDEX fki_punches_timesheet_id_must_be_valid_timesheet
    ON public.punches(timesheet_id);
	
CREATE TRIGGER enforce_update_last_modified_punches_insert BEFORE INSERT ON public.punches
	FOR EACH ROW
	EXECUTE PROCEDURE public.enforce_update_to_last_modified_by_and_on();
	
CREATE TRIGGER enforce_update_last_modified_punches_update BEFORE UPDATE ON public.punches
	FOR EACH ROW
	EXECUTE PROCEDURE public.enforce_update_to_last_modified_by_and_on();

CREATE TYPE punch_event_type AS ENUM ('IN', 'OUT', 'BIN', 'BOUT');
CREATE TYPE location_type AS ENUM ('GEO', 'IP', 'KIOSK');

CREATE TABLE public.locations
(
    id uuid NOT NULL DEFAULT uuid_generate_v4(),
    created_by uuid,
	created_on double precision DEFAULT extract(epoch from now() at time zone 'utc'),
	last_modified_by uuid,
	last_modified_on double precision DEFAULT extract(epoch from now() at time zone 'utc'),
	type location_type NOT NULL,
	ip text,
	geo_lat double precision,
	geo_lng double precision,
	geo_acc double precision,
	kiosk_name text,
	notes text,
    PRIMARY KEY (id)
);

ALTER TABLE public.locations
    ADD CONSTRAINT created_by_must_be_valid_user FOREIGN KEY (created_by)
    REFERENCES public.users (id) MATCH SIMPLE
    ON UPDATE NO ACTION
    ON DELETE NO ACTION;
CREATE INDEX fki_locations_created_by_must_be_valid_user
    ON public.locations(created_by);

ALTER TABLE public.locations
    ADD CONSTRAINT last_modified_by_id_must_be_valid_user FOREIGN KEY (last_modified_by)
    REFERENCES public.users (id) MATCH SIMPLE
    ON UPDATE NO ACTION
    ON DELETE NO ACTION;
CREATE INDEX fki_locations_last_modified_by_id_must_be_valid_user
    ON public.locations(last_modified_by);

CREATE TRIGGER enforce_update_last_modified_locations_insert BEFORE INSERT ON public.locations
	FOR EACH ROW
	EXECUTE PROCEDURE public.enforce_update_to_last_modified_by_and_on();
	
CREATE TRIGGER enforce_update_last_modified_locations_update BEFORE UPDATE ON public.locations
	FOR EACH ROW
	EXECUTE PROCEDURE public.enforce_update_to_last_modified_by_and_on();

CREATE TABLE public.punch_events
(
    id uuid NOT NULL DEFAULT uuid_generate_v4(),
    created_by uuid,
	created_on double precision DEFAULT extract(epoch from now() at time zone 'utc'),
	last_modified_by uuid,
	last_modified_on double precision DEFAULT extract(epoch from now() at time zone 'utc'),
	punch_id uuid,
	type punch_event_type NOT NULL,
	notes text,
	entry double precision NOT NULL,
	location_id uuid,
    PRIMARY KEY (id)
);

ALTER TABLE public.punch_events
    ADD CONSTRAINT created_by_must_be_valid_user FOREIGN KEY (created_by)
    REFERENCES public.users (id) MATCH SIMPLE
    ON UPDATE NO ACTION
    ON DELETE NO ACTION;
CREATE INDEX fki_punch_events_created_by_must_be_valid_user
    ON public.punch_events(created_by);

ALTER TABLE public.punch_events
    ADD CONSTRAINT last_modified_by_id_must_be_valid_user FOREIGN KEY (last_modified_by)
    REFERENCES public.users (id) MATCH SIMPLE
    ON UPDATE NO ACTION
    ON DELETE NO ACTION;
CREATE INDEX fki_punch_events_last_modified_by_id_must_be_valid_user
    ON public.punch_events(last_modified_by);

ALTER TABLE public.punch_events
    ADD CONSTRAINT punch_id_must_be_valid_punch FOREIGN KEY (punch_id)
    REFERENCES public.punches (id) MATCH SIMPLE
    ON UPDATE NO ACTION
    ON DELETE NO ACTION;
CREATE INDEX fki_punch_events_punch_id_must_be_valid_punch
    ON public.punch_events(punch_id);
	
ALTER TABLE public.punch_events
    ADD CONSTRAINT location_id_must_be_valid_location FOREIGN KEY (location_id)
    REFERENCES public.locations (id) MATCH SIMPLE
    ON UPDATE NO ACTION
    ON DELETE NO ACTION;
CREATE INDEX fki_punch_events_location_id_must_be_valid_location
    ON public.punch_events(location_id);

CREATE TRIGGER enforce_update_last_modified_punch_events_insert BEFORE INSERT ON public.punch_events
	FOR EACH ROW
	EXECUTE PROCEDURE public.enforce_update_to_last_modified_by_and_on();
	
CREATE TRIGGER enforce_update_last_modified_punch_events_update BEFORE UPDATE ON public.punch_events
	FOR EACH ROW
	EXECUTE PROCEDURE public.enforce_update_to_last_modified_by_and_on();

-- Grant Access To The Tables
GRANT ALL ON TABLE public.auth TO bontime_users;
GRANT ALL ON TABLE public.email_verification TO bontime_users;
GRANT ALL ON TABLE public.locations TO bontime_users;
GRANT ALL ON TABLE public.password_reset TO bontime_users;
GRANT ALL ON TABLE public.permissions TO bontime_users;
GRANT ALL ON TABLE public.punch_events TO bontime_users;
GRANT ALL ON TABLE public.punches TO bontime_users;
GRANT ALL ON TABLE public.teams TO bontime_users;
GRANT ALL ON TABLE public.timesheets TO bontime_users;
GRANT ALL ON TABLE public.users TO bontime_users;

ALTER TABLE public.punches
    ADD CONSTRAINT user_id_must_be_valid_user FOREIGN KEY (user_id)
    REFERENCES public.users (id) MATCH SIMPLE
    ON UPDATE NO ACTION
    ON DELETE NO ACTION;
CREATE INDEX fki_punches_user_id_must_be_valid_user
    ON public.punches(user_id);

-- PROCEDURE: Generate Password For Administrator

-- Add Core Functions
CREATE OR REPLACE FUNCTION public.clock_in(lookup_user_id uuid, lookup_event_date date, entry_time time, lookup_punch_type punch_types, passed_notes text)
    RETURNS uuid
    LANGUAGE 'plpgsql'
    COST 100
    VOLATILE 
AS $BODY$
DECLARE
	cur_user uuid;
	event_date_epoch double precision;
	existing_punch record;
	new_punch uuid;
	res uuid;
BEGIN
	cur_user := (SELECT current_user)::UUID;
	event_date_epoch := extract(epoch from lookup_event_date at time zone 'utc');
	SELECT id, event_date, user_id FROM public.punches WHERE user_id = lookup_user_id AND event_date = event_date_epoch AND punch_type = lookup_punch_type INTO existing_punch;
	-- Check if Punch Exists
	IF existing_punch.id IS NOT NULL THEN
		-- Use Existing Punch
		INSERT INTO punch_events(created_by, punch_id, "type", notes, entry) VALUES(cur_user, existing_punch.id, 'IN'::punch_event_type, passed_notes, date_part('epoch'::text, timezone('utc'::text, (lookup_event_date + entry_time)))) RETURNING id INTO res;
	ELSE
		-- Create New Punches Row
		INSERT INTO punches(created_by, punch_type, event_date, user_id) VALUES(cur_user, lookup_punch_type, event_date_epoch, lookup_user_id) RETURNING id INTO new_punch;
		-- INSERT Punch Event Using The New Punches Item
		INSERT INTO punch_events(created_by, punch_id, "type", notes, entry) VALUES(cur_user, new_punch, 'IN'::punch_event_type, passed_notes, date_part('epoch'::text, timezone('utc'::text, (lookup_event_date + entry_time)))) RETURNING id INTO res;
	END IF;
																					
	RETURN res;

EXCEPTION
	WHEN data_exception THEN
		RAISE EXCEPTION '[CLOCK IN FAILED] - UDF ERROR [DATA EXCEPTION] - SQLSTATE: %, SQLERRM: %',SQLSTATE,SQLERRM;
		RETURN NULL::UUID;
	WHEN unique_violation THEN
		RAISE EXCEPTION '[CLOCK IN FAILED] - UDF ERROR [UNIQUE] - SQLSTATE: %, SQLERRM: %',SQLSTATE,SQLERRM;
		RETURN NULL::UUID;
	WHEN OTHERS THEN
		RAISE EXCEPTION '[CLOCK IN FAILED] - UDF ERROR [OTHER] - SQLSTATE: %, SQLERRM: %',SQLSTATE,SQLERRM;
		RETURN NULL::UUID;
END
$BODY$;

ALTER FUNCTION public.clock_in(uuid, date, time, punch_types, text)
    OWNER TO "bontime_rest_api_data_user";

GRANT EXECUTE ON FUNCTION public.clock_in(uuid, date, time, punch_types, text) TO "bontime_users";


CREATE OR REPLACE FUNCTION public.clock_out(lookup_user_id uuid, lookup_event_date date, entry_time time, lookup_punch_type punch_types, passed_notes text)
    RETURNS uuid
    LANGUAGE 'plpgsql'
    COST 100
    VOLATILE 
AS $BODY$
DECLARE
	cur_user uuid;
	event_date_epoch double precision;
	existing_punch record;
	new_punch uuid;
	res uuid;
BEGIN
	cur_user := (SELECT current_user)::UUID;
	event_date_epoch := extract(epoch from lookup_event_date at time zone 'utc');
	SELECT id, event_date, user_id FROM public.punches WHERE user_id = lookup_user_id AND event_date = event_date_epoch AND punch_type = lookup_punch_type INTO existing_punch;
	-- Check if Punch Exists
	IF existing_punch.id IS NOT NULL THEN
		-- Use Existing Punch
		INSERT INTO punch_events(created_by, punch_id, "type", notes, entry) VALUES(cur_user, existing_punch.id, 'OUT'::punch_event_type, passed_notes, date_part('epoch'::text, timezone('utc'::text, (lookup_event_date + entry_time)))) RETURNING id INTO res;
	ELSE
		-- Create New Punches Row
		INSERT INTO punches(created_by, punch_type, event_date, user_id) VALUES(cur_user, lookup_punch_type, event_date_epoch, lookup_user_id) RETURNING id INTO new_punch;
		-- INSERT Punch Event Using The New Punches Item
		INSERT INTO punch_events(created_by, punch_id, "type", notes, entry) VALUES(cur_user, new_punch, 'OUT'::punch_event_type, passed_notes, date_part('epoch'::text, timezone('utc'::text, (lookup_event_date + entry_time)))) RETURNING id INTO res;
	END IF;
																					
	RETURN res;

EXCEPTION
	WHEN data_exception THEN
		RAISE EXCEPTION '[CLOCK OUT FAILED] - UDF ERROR [DATA EXCEPTION] - SQLSTATE: %, SQLERRM: %',SQLSTATE,SQLERRM;
		RETURN NULL::UUID;
	WHEN unique_violation THEN
		RAISE EXCEPTION '[CLOCK OUT FAILED] - UDF ERROR [UNIQUE] - SQLSTATE: %, SQLERRM: %',SQLSTATE,SQLERRM;
		RETURN NULL::UUID;
	WHEN OTHERS THEN
		RAISE EXCEPTION '[CLOCK OUT FAILED] - UDF ERROR [OTHER] - SQLSTATE: %, SQLERRM: %',SQLSTATE,SQLERRM;
		RETURN NULL::UUID;
END
$BODY$;

ALTER FUNCTION public.clock_out(uuid, date, time, punch_types, text)
    OWNER TO "bontime_rest_api_data_user";

GRANT EXECUTE ON FUNCTION public.clock_out(uuid, date, time, punch_types, text) TO "bontime_users";


CREATE OR REPLACE FUNCTION public.break_in(lookup_user_id uuid, lookup_event_date date, entry_time time, lookup_punch_type punch_types, passed_notes text)
    RETURNS uuid
    LANGUAGE 'plpgsql'
    COST 100
    VOLATILE 
AS $BODY$
DECLARE
	cur_user uuid;
	event_date_epoch double precision;
	existing_punch record;
	new_punch uuid;
	res uuid;
BEGIN
	cur_user := (SELECT current_user)::UUID;
	event_date_epoch := extract(epoch from lookup_event_date at time zone 'utc');
	SELECT id, event_date, user_id FROM public.punches WHERE user_id = lookup_user_id AND event_date = event_date_epoch AND punch_type = lookup_punch_type INTO existing_punch;
	-- Check if Punch Exists
	IF existing_punch.id IS NOT NULL THEN
		-- Use Existing Punch
		INSERT INTO punch_events(created_by, punch_id, "type", notes, entry) VALUES(cur_user, existing_punch.id, 'BIN'::punch_event_type, passed_notes, date_part('epoch'::text, timezone('utc'::text, (lookup_event_date + entry_time)))) RETURNING id INTO res;
	ELSE
		-- Create New Punches Row
		INSERT INTO punches(created_by, punch_type, event_date, user_id) VALUES(cur_user, lookup_punch_type, event_date_epoch, lookup_user_id) RETURNING id INTO new_punch;
		-- INSERT Punch Event Using The New Punches Item
		INSERT INTO punch_events(created_by, punch_id, "type", notes, entry) VALUES(cur_user, new_punch, 'BIN'::punch_event_type, passed_notes, date_part('epoch'::text, timezone('utc'::text, (lookup_event_date + entry_time)))) RETURNING id INTO res;
	END IF;
																					
	RETURN res;

EXCEPTION
	WHEN data_exception THEN
		RAISE EXCEPTION '[BREAK IN FAILED] - UDF ERROR [DATA EXCEPTION] - SQLSTATE: %, SQLERRM: %',SQLSTATE,SQLERRM;
		RETURN NULL::UUID;
	WHEN unique_violation THEN
		RAISE EXCEPTION '[BREAK IN FAILED] - UDF ERROR [UNIQUE] - SQLSTATE: %, SQLERRM: %',SQLSTATE,SQLERRM;
		RETURN NULL::UUID;
	WHEN OTHERS THEN
		RAISE EXCEPTION '[BREAK IN FAILED] - UDF ERROR [OTHER] - SQLSTATE: %, SQLERRM: %',SQLSTATE,SQLERRM;
		RETURN NULL::UUID;
END
$BODY$;

ALTER FUNCTION public.break_in(uuid, date, time, punch_types, text)
    OWNER TO "bontime_rest_api_data_user";

GRANT EXECUTE ON FUNCTION public.break_in(uuid, date, time, punch_types, text) TO "bontime_users";


CREATE OR REPLACE FUNCTION public.break_out(lookup_user_id uuid, lookup_event_date date, entry_time time, lookup_punch_type punch_types, passed_notes text)
    RETURNS uuid
    LANGUAGE 'plpgsql'
    COST 100
    VOLATILE 
AS $BODY$
DECLARE
	cur_user uuid;
	event_date_epoch double precision;
	existing_punch record;
	new_punch uuid;
	res uuid;
BEGIN
	cur_user := (SELECT current_user)::UUID;
	event_date_epoch := extract(epoch from lookup_event_date at time zone 'utc');
	SELECT id, event_date, user_id FROM public.punches WHERE user_id = lookup_user_id AND event_date = event_date_epoch AND punch_type = lookup_punch_type INTO existing_punch;
	-- Check if Punch Exists
	IF existing_punch.id IS NOT NULL THEN
		-- Use Existing Punch
		INSERT INTO punch_events(created_by, punch_id, "type", notes, entry) VALUES(cur_user, existing_punch.id, 'BOUT'::punch_event_type, passed_notes, date_part('epoch'::text, timezone('utc'::text, (lookup_event_date + entry_time)))) RETURNING id INTO res;
	ELSE
		-- Create New Punches Row
		INSERT INTO punches(created_by, punch_type, event_date, user_id) VALUES(cur_user, lookup_punch_type, event_date_epoch, lookup_user_id) RETURNING id INTO new_punch;
		-- INSERT Punch Event Using The New Punches Item
		INSERT INTO punch_events(created_by, punch_id, "type", notes, entry) VALUES(cur_user, new_punch, 'BOUT'::punch_event_type, passed_notes, date_part('epoch'::text, timezone('utc'::text, (lookup_event_date + entry_time)))) RETURNING id INTO res;
	END IF;
																					
	RETURN res;

EXCEPTION
	WHEN data_exception THEN
		RAISE EXCEPTION '[BREAK OUT FAILED] - UDF ERROR [DATA EXCEPTION] - SQLSTATE: %, SQLERRM: %',SQLSTATE,SQLERRM;
		RETURN NULL::UUID;
	WHEN unique_violation THEN
		RAISE EXCEPTION '[BREAK OUT FAILED] - UDF ERROR [UNIQUE] - SQLSTATE: %, SQLERRM: %',SQLSTATE,SQLERRM;
		RETURN NULL::UUID;
	WHEN OTHERS THEN
		RAISE EXCEPTION '[BREAK OUT FAILED] - UDF ERROR [OTHER] - SQLSTATE: %, SQLERRM: %',SQLSTATE,SQLERRM;
		RETURN NULL::UUID;
END
$BODY$;

ALTER FUNCTION public.break_out(uuid, date, time, punch_types, text)
    OWNER TO "bontime_rest_api_data_user";

GRANT EXECUTE ON FUNCTION public.break_out(uuid, date, time, punch_types, text) TO "bontime_users";

-- Check Status of Employee
CREATE OR REPLACE VIEW public.check_status AS
 WITH seek AS (
         SELECT timezone('utc'::text, to_timestamp(date_part('epoch'::text, current_setting('loc.seek_time'::text)::timestamp without time zone))) AS seek_tstamp,
            timezone('utc'::text, to_timestamp(date_part('epoch'::text, current_setting('loc.seek_time'::text)::timestamp without time zone)))::date AS seek_date,
            date_part('epoch'::text, current_setting('loc.seek_time'::text)::timestamp without time zone) AS seek_epoch
        ), selected_punch AS (
         SELECT punches.id,
            punches.punch_type,
            punches.timesheet_id,
            punches.event_date,
            timezone('utc'::text, to_timestamp(punches.event_date))::date AS clock_day
           FROM punches
          WHERE (( SELECT seek.seek_date
                   FROM seek)) = timezone('utc'::text, to_timestamp(punches.event_date))::date AND punches.user_id = current_setting('loc.seek_user'::text)::uuid
        )
 SELECT p.id AS punch_id,
    p.punch_type,
    p.timesheet_id,
    p.event_date,
    p.clock_day,
    pe.id AS punch_event_id,
	TO_CHAR(timezone('utc'::text, to_timestamp(pe.entry))::TIMESTAMP, 'hh12:mi AM')::TEXT  AS clock_time,
    pe.type,
    (( SELECT seek.seek_tstamp
           FROM seek)) - timezone('utc'::text, to_timestamp(pe.entry)) AS for_interval,
        CASE
            WHEN pe.type = 'BIN'::punch_event_type THEN 'On Break'::text
            WHEN pe.type = 'BOUT'::punch_event_type THEN 'Back From Break'::text
            WHEN pe.type = 'IN'::punch_event_type THEN 'Clocked In'::text
            ELSE 'Clocked Out'::text
        END AS current_status
   FROM selected_punch p
     LEFT JOIN punch_events pe ON pe.punch_id = p.id
  WHERE (( SELECT seek.seek_tstamp
           FROM seek)) >= timezone('utc'::text, to_timestamp(pe.entry))
  ORDER BY pe.entry DESC
 LIMIT 1;

ALTER TABLE public.check_status
    OWNER TO bontime_rest_api_data_user;

GRANT ALL ON TABLE public.check_status TO bontime_users;
GRANT ALL ON TABLE public.check_status TO bontime_rest_api_data_user;

-- Function To Create Unique Kiosk PIN Codes
-- 8 digit pin codes
CREATE OR REPLACE FUNCTION public.generate_kiosk_pin()
    RETURNS bigint
    LANGUAGE 'plpgsql'
    COST 100
    VOLATILE 
AS $BODY$
DECLARE
	pin_good boolean;
	pin bigint;
	found_id uuid;
	loop_count int;
BEGIN
	pin_good := false;
	loop_count := 0;
	WHILE NOT(pin_good) AND loop_count < 25000 LOOP
	    pin := floor(random() * 89999999 + 10000000)::bigint;
	    SELECT id INTO found_id FROM public.auth WHERE kiosk_pin = pin;
	    IF found_id is null THEN
			pin_good := true;
	    END IF;
		loop_count := loop_count + 1;
	END LOOP;
																					
	RETURN pin;

EXCEPTION
	WHEN data_exception THEN
		RAISE EXCEPTION '[GENERATE KIOSK PIN FAILED] - UDF ERROR [DATA EXCEPTION] - SQLSTATE: %, SQLERRM: %',SQLSTATE,SQLERRM;
		RETURN NULL::bigint;
	WHEN unique_violation THEN
		RAISE EXCEPTION '[GENERATE KIOSK PIN FAILED] - UDF ERROR [UNIQUE] - SQLSTATE: %, SQLERRM: %',SQLSTATE,SQLERRM;
		RETURN NULL::bigint;
	WHEN OTHERS THEN
		RAISE EXCEPTION '[GENERATE KIOSK PIN FAILED] - UDF ERROR [OTHER] - SQLSTATE: %, SQLERRM: %',SQLSTATE,SQLERRM;
		RETURN NULL::bigint;
END
$BODY$;

ALTER FUNCTION public.generate_kiosk_pin() OWNER TO "bontime_rest_api_data_user";
GRANT EXECUTE ON FUNCTION public.generate_kiosk_pin() TO "bontime_users";

-- Function To Assign Kiosk Pin Codes
CREATE OR REPLACE FUNCTION public.upsert_kiosk_pin(lookup_user_id uuid)
    RETURNS bigint
    LANGUAGE 'plpgsql'
    COST 100
    VOLATILE 
AS $BODY$
DECLARE
	pin bigint;
	auth_id uuid;
BEGIN
	pin :=  (SELECT public.generate_kiosk_pin());
	SELECT id INTO auth_id FROM public.auth WHERE auth.user_id = lookup_user_id;
	
	IF auth_id is null THEN
		INSERT INTO public.auth(created_by, user_id, expires, kiosk_pin) 
		VALUES ((SELECT current_user)::UUID, lookup_user_id, date_part('epoch'::text, timezone('utc'::text, (now()))), pin);
	ELSE
		UPDATE public.auth SET kiosk_pin = pin WHERE user_id = lookup_user_id;
	END IF;
																					
	RETURN pin;

EXCEPTION
	WHEN data_exception THEN
		RAISE EXCEPTION '[UPSERT KIOSK PIN FAILED] - UDF ERROR [DATA EXCEPTION] - SQLSTATE: %, SQLERRM: %',SQLSTATE,SQLERRM;
		RETURN NULL::bigint;
	WHEN unique_violation THEN
		RAISE EXCEPTION '[UPSERT KIOSK PIN FAILED] - UDF ERROR [UNIQUE] - SQLSTATE: %, SQLERRM: %',SQLSTATE,SQLERRM;
		RETURN NULL::bigint;
	WHEN OTHERS THEN
		RAISE EXCEPTION '[UPSERT KIOSK PIN FAILED] - UDF ERROR [OTHER] - SQLSTATE: %, SQLERRM: %',SQLSTATE,SQLERRM;
		RETURN NULL::bigint;
END
$BODY$;

ALTER FUNCTION public.upsert_kiosk_pin(lookup_user_id uuid) OWNER TO "bontime_rest_api_data_user";
GRANT EXECUTE ON FUNCTION public.upsert_kiosk_pin(lookup_user_id uuid) TO "bontime_users";

-- Function To Create User
CREATE TYPE create_user_type AS (user_id uuid, first_name text, middle_name text, last_name text, email text, pin bigint, email_verification uuid );
CREATE OR REPLACE FUNCTION public.create_user(fname text, mname text, lname text, email text, team uuid[], perm uuid, hash text)
    RETURNS create_user_type
    LANGUAGE 'plpgsql'
    COST 100
    VOLATILE 
AS $BODY$
DECLARE
	pin bigint;
	uid uuid;
	res record;
	email_verification uuid;
BEGIN
	INSERT INTO public.users(created_by, teams, permset, email, first_name, middle_name, last_name) VALUES ((SELECT current_user)::UUID, team, perm, email, fname, mname, lname) RETURNING id INTO uid;
	
	INSERT INTO public.auth(created_by, user_id, expires, pass)VALUES ( (SELECT current_user)::UUID, uid, date_part('epoch'::text, timezone('utc'::text, (now() + interval '1 years'))), hash);
	
	SELECT upsert_kiosk_pin into pin FROM public.upsert_kiosk_pin(uid);
	
	INSERT INTO public.email_verification(user_id, expires) VALUES (uid, date_part('epoch'::text, timezone('utc'::text, (now() + interval '3 days')))) RETURNING id INTO email_verification;
	
	SELECT usr.id as user_id, usr.first_name, usr.middle_name, usr.last_name, usr.email, pin, email_verification FROM public.users as usr WHERE usr.id = uid INTO res;
	
	RETURN res;

EXCEPTION
	WHEN data_exception THEN
		RAISE EXCEPTION '[CREATE USER FAILED] - UDF ERROR [DATA EXCEPTION] - SQLSTATE: %, SQLERRM: %',SQLSTATE,SQLERRM;
		RETURN NULL::UUID as user_id, NULL::TEXT as first_name, NULL::TEXT as middle_name, NULL::TEXT as last_name, NULL::TEXT as email, NULL::BIGINT as pin, NULL::UUID as email_verification;
	WHEN unique_violation THEN
		RAISE EXCEPTION '[CREATE USER FAILED] - UDF ERROR [UNIQUE] - SQLSTATE: %, SQLERRM: %',SQLSTATE,SQLERRM;
		RETURN NULL::UUID as user_id, NULL::TEXT as first_name, NULL::TEXT as middle_name, NULL::TEXT as last_name, NULL::TEXT as email, NULL::BIGINT as pin, NULL::UUID as email_verification;	
	WHEN OTHERS THEN	
		RAISE EXCEPTION '[CREATE USER FAILED] - UDF ERROR [OTHER] - SQLSTATE: %, SQLERRM: %',SQLSTATE,SQLERRM;
		RETURN NULL::UUID as user_id, NULL::TEXT as first_name, NULL::TEXT as middle_name, NULL::TEXT as last_name, NULL::TEXT as email, NULL::BIGINT as pin, NULL::UUID as email_verification;
END
$BODY$;

ALTER FUNCTION public.create_user(fname text, mname text, lname text, email text, team uuid[], perm uuid, hash text) OWNER TO "bontime_rest_api_data_user";
GRANT EXECUTE ON FUNCTION public.create_user(fname text, mname text, lname text, email text, team uuid[], perm uuid, hash text) TO "bontime_users";

-- Function To Quickly Verify Email
CREATE OR REPLACE FUNCTION public.verify_email(verification_id uuid)
    RETURNS boolean
    LANGUAGE 'plpgsql'
    COST 100
    VOLATILE 
AS $BODY$
DECLARE
	uid uuid;
BEGIN
	UPDATE public.email_verification SET verified = true WHERE id = verification_id AND expires > extract(epoch from now() at time zone 'utc') RETURNING user_id INTO uid;
	
	IF uid is null THEN
		RETURN false;
	ELSE
		RETURN true;
	END IF;

EXCEPTION
	WHEN data_exception THEN
		RAISE EXCEPTION '[EMAIL VERIFICATION FAILED] - UDF ERROR [DATA EXCEPTION] - SQLSTATE: %, SQLERRM: %',SQLSTATE,SQLERRM;
		RETURN true;
	WHEN unique_violation THEN
		RAISE EXCEPTION '[EMAIL VERIFICATION FAILED] - UDF ERROR [UNIQUE] - SQLSTATE: %, SQLERRM: %',SQLSTATE,SQLERRM;
	 	RETURN true;
	WHEN OTHERS THEN	
		RAISE EXCEPTION '[EMAIL VERIFICATION FAILED] - UDF ERROR [OTHER] - SQLSTATE: %, SQLERRM: %',SQLSTATE,SQLERRM;
		RETURN true;
END
$BODY$;

ALTER FUNCTION public.verify_email(verification_id uuid) OWNER TO "bontime_rest_api_data_user";
GRANT EXECUTE ON FUNCTION public.verify_email(verification_id uuid) TO "bontime_users";

-- ADD AUTH FOR SUPERADMIN
INSERT INTO public.auth(created_by, created_on, user_id, expires, pass) VALUES ('70c505eb-6671-47e6-a8a7-9d7d7fccf2b6', extract(epoch from now() at time zone 'utc'), '70c505eb-6671-47e6-a8a7-9d7d7fccf2b6', extract(epoch from (now() + interval '5 years') at time zone 'utc'), '$2a$10$90WTJvA0P5e.y55KVMtp9ushL/e8WzDq78mIpUhIRoqsTFNd5zIbm');

-- Function To Report Punches For Single User Over Specified Time Period
CREATE OR REPLACE FUNCTION public.report_punches_for_single_user(seek_user_id uuid, start_date date, end_date date)
    RETURNS TABLE(clock_day date, user_id uuid, notice text, clock_type punch_types, start_time text, end_time text, raw_minutes int, minutes_on_break int, billable_minutes int)
    LANGUAGE 'plpgsql'
    COST 100
    VOLATILE 
	ROWS 1000
AS $BODY$
DECLARE
	start_epoch double precision;
	end_epoch double precision;
	cur_day record;
	_c text;
BEGIN
	start_epoch := extract(epoch from start_date at time zone 'utc');
	end_epoch := extract(epoch from end_date at time zone 'utc');
	
	-- Ensure Start Date <=  End Date
	IF start_date > end_date THEN
		RAISE EXCEPTION 'Start Date Cannot Be Greater Than End Date';
	ELSE
		RAISE NOTICE 'Start Date: % < End Date: %', start_date, end_date;
	END IF;
	
	-- Create Day Based Table
	DROP TABLE IF EXISTS temp_punches_for_time_period;
	
	CREATE TEMPORARY TABLE temp_punches_for_time_period AS
		SELECT 
			p.id, 
			p.user_id, 
			to_timestamp(p.event_date)::TIMESTAMP, 
			(SELECT array_agg(pe.id) as event_ids FROM public.punch_events as pe WHERE pe.punch_id = p.id) 
		FROM public.punches as p
			WHERE to_timestamp(p.event_date)::DATE >= start_date
			AND to_timestamp(p.event_date)::DATE <= end_date
			AND p.user_id = seek_user_id;
	
	-- Create Table For Results
	DROP TABLE IF EXISTS temp_report_single_user_result_table;
	
	CREATE TEMPORARY TABLE temp_report_single_user_result_table (
		clock_day date, 
		user_id uuid, 
		notice text, 
		clock_type punch_types, 
		start_time text, 
		end_time text, 
		tmp_raw_minutes int, 
		tmp_minutes_on_break int, 
		tmp_billable_minutes int
	);
		
	
	-- Perform Action Per Day
	FOR cur_day IN SELECT * FROM temp_punches_for_time_period
	LOOP
		RAISE NOTICE 'Current Punch Record: %', cur_day;
		WITH listing as (
			SELECT pe.id, pe.entry, to_timestamp(pe.entry) at time zone 'utc' as entry_timestamp, pe.type, pe.notes 
			FROM punch_events as pe
			WHERE pe.id IN (SELECT UNNEST(cur_day.event_ids))
			ORDER BY entry ASC
		),in_list as (
			SELECT row_number() over (ORDER BY entry ASC) as rownum, lst.id, lst.entry, lst.entry_timestamp, lst.type, lst.notes
			FROM listing as lst
			WHERE lst.type = 'IN'
			ORDER BY entry ASC
		), out_list as (
			SELECT row_number() over (ORDER BY entry ASC) as rownum, lst.id, lst.entry, lst.entry_timestamp, lst.type, lst.notes
			FROM listing as lst
			WHERE lst.type = 'OUT'
			ORDER BY entry ASC
		), break_start_list AS (
			SELECT row_number() over (ORDER BY entry ASC) as rownum, lst.id, lst.entry, lst.entry_timestamp, lst.type, lst.notes
			FROM listing as lst
			WHERE lst.type = 'BIN'
			ORDER BY entry ASC
		), break_end_list AS (
			SELECT row_number() over (ORDER BY entry ASC) as rownum, lst.id, lst.entry, lst.entry_timestamp, lst.type, lst.notes
			FROM listing as lst
			WHERE lst.type = 'BOUT'
			ORDER BY entry ASC
		), list_in_out_paired AS (
			SELECT 
				ci.rownum, 
				ci.id as clock_in_event_id, 
				ci.entry as clock_in_entry,
				ci.entry_timestamp as clock_in_entry_timestamp,
				ci.notes as clock_in_notes,
				co.id as clock_out_event_id, 
				co.entry as clock_out_entry,
				co.entry_timestamp as clock_out_entry_timestamp,
				co.notes as clock_out_notes,
				EXTRACT(EPOCH FROM (co.entry_timestamp - ci.entry_timestamp)::INTERVAL)/60 as raw_clock_minutes
			FROM in_list as ci
			LEFT JOIN out_list as co ON ci.rownum = co.rownum
		), list_of_breaks AS (
			SELECT 
				bsl.rownum, 
				bsl.id as break_start_event_id, 
				bsl.entry as break_start_entry,
				bsl.entry_timestamp as break_start_entry_timestamp,
				bsl.notes as break_start_notes,
				bel.id as break_end_event_id, 
				bel.entry as break_end_entry,
				bel.entry_timestamp as break_end_entry_timestamp,
				bel.notes as break_end_notes,
				EXTRACT(EPOCH FROM (bel.entry_timestamp - bsl.entry_timestamp)::INTERVAL)/60 as minutes_on_break
			FROM break_start_list as bsl
			LEFT JOIN break_end_list as bel ON bsl.rownum = bel.rownum
		), minute_totals_per_row AS (
			SELECT
				rownum, 
				CASE WHEN rownum > 0 THEN true ELSE false END AS clock_exists,
				clock_in_event_id,
				clock_out_event_id,
				raw_clock_minutes,
				(SELECT CASE WHEN COUNT(rownum) > 0 THEN true ELSE false END FROM list_of_breaks as lob WHERE lob.break_start_entry > clock_in_entry AND lob.break_end_entry < clock_out_entry) as break_exists,
				(SELECT SUM(lob.minutes_on_break) FROM list_of_breaks as lob WHERE lob.break_start_entry > clock_in_entry AND lob.break_end_entry < clock_out_entry) as total_minutes_on_break
			FROM list_in_out_paired
		), billable AS (
			SELECT 
				cur_day.id as punch_id,
				rownum,
				clock_exists,
				break_exists,
				CASE WHEN clock_exists AND raw_clock_minutes is null THEN true ELSE false END as clock_incomplete,
				CASE WHEN break_exists AND total_minutes_on_break is null THEN true ELSE false END as break_incomplete,
				clock_in_event_id,
				clock_out_event_id,
				raw_clock_minutes,
				total_minutes_on_break,
				CASE 
					WHEN break_exists and NOT(CASE WHEN break_exists AND total_minutes_on_break is null THEN true ELSE false END) THEN 
						(raw_clock_minutes - total_minutes_on_break)
					ELSE
						raw_clock_minutes
				END as billable_minutes
			FROM minute_totals_per_row
		), formatted_list_of_breaks AS (
			SELECT
				break_start_entry,
				break_end_entry,
				NULL::DATE as clock_day,
				p.user_id,
				'Break Child' as notice,
				NULL::punch_types  as clock_type,
				TO_CHAR(timezone('utc'::text, to_timestamp(break_start_entry))::TIMESTAMP, 'hh12:mi AM') as start_time,
				TO_CHAR(timezone('utc'::text, to_timestamp(break_end_entry))::TIMESTAMP, 'hh12:mi AM') as end_time,
				NULL::INT as raw_minutes,
				ROUND(b.minutes_on_break)::INT as minutes_on_break,
				NULL::INT as billable_minutes
			FROM list_of_breaks as b
			LEFT JOIN public.punch_events as pe ON pe.id = b.break_start_event_id
			LEFT JOIN public.punches as p ON p.id = pe.punch_id
		), formatted_clock_event_list as (
			SELECT
				ci.entry as clock_in_entry,
				co.entry as clock_out_entry,
				to_timestamp(p.event_date)::DATE as clock_day,
				p.user_id,
				-- TODO: Add Notice Section TO Alert If Break, Or Clock In Clock Out Incomplete
				CASE 
					WHEN clock_incomplete AND break_incomplete THEN 
						'Out On Break'
					WHEN clock_incomplete THEN
						'Pending Clock Out'
					ELSE
						''
				END as notice,
				p.punch_type as clock_type,
				--timezone('utc'::text, to_timestamp(ci.entry))::TIMESTAMP as start_tstamp,
				TO_CHAR(timezone('utc'::text, to_timestamp(ci.entry))::TIMESTAMP, 'hh12:mi AM') as start_time,
				--timezone('utc'::text, to_timestamp(co.entry))::TIMESTAMP as end_tstamp,
				TO_CHAR(timezone('utc'::text, to_timestamp(co.entry)), 'hh:mi AM') as end_time,
				ROUND(b.raw_clock_minutes)::INT as raw_minutes,
				ROUND(b.total_minutes_on_break)::INT as minutes_on_break,
				ROUND(b.billable_minutes)::INT as billable_minutes
			FROM billable as b
			LEFT JOIN public.punches as p ON p.id = b.punch_id
			LEFT JOIN public.punch_events as ci ON ci.id = b.clock_in_event_id
			LEFT JOIN public.punch_events as co ON co.id = b.clock_out_event_id	
		), all_together_now AS (
			SELECT * FROM formatted_clock_event_list
			UNION
			SELECT * FROM formatted_list_of_breaks
			ORDER BY clock_in_entry ASC
		)
		INSERT INTO temp_report_single_user_result_table(clock_day, user_id, notice, clock_type, start_time, end_time, tmp_raw_minutes, tmp_minutes_on_break, tmp_billable_minutes)
			SELECT atn.clock_day, atn.user_id, atn.notice, atn.clock_type, atn.start_time, atn.end_time, atn.raw_minutes, atn.minutes_on_break, atn.billable_minutes FROM all_together_now as atn;
	END LOOP;
	
	RETURN QUERY EXECUTE 'SELECT trep.clock_day, trep.user_id, trep.notice, trep.clock_type, trep.start_time, trep.end_time, trep.tmp_raw_minutes as raw_minutes, trep.tmp_minutes_on_break as minutes_on_break, trep.tmp_billable_minutes as billable_minutes FROM temp_report_single_user_result_table as trep';

EXCEPTION
	WHEN data_exception THEN
		GET STACKED DIAGNOSTICS _c = PG_EXCEPTION_CONTEXT;
		RAISE EXCEPTION '[report_punches_for_single_user FAILED] - UDF ERROR [DATA EXCEPTION] - SQLSTATE: %, SQLERRM: %, CONTEXT: >> % <<',SQLSTATE,SQLERRM,_c;
		RETURN QUERY EXECUTE 'SELECT NULL::DATE as clock_day, NULL::UUID as user_id, NULL::TEXT as notice, NULL as clock_type, NULL::TEXT as start_time, NULL::TEXT as end_time, NULL::INT as raw_minutes, NULL::INT as minutes_on_break, NULL::INT as billable_minutes';
	WHEN unique_violation THEN
		GET STACKED DIAGNOSTICS _c = PG_EXCEPTION_CONTEXT;
		RAISE EXCEPTION '[report_punches_for_single_user FAILED] - UDF ERROR [UNIQUE] - SQLSTATE: %, SQLERRM: %, CONTEXT: >> % <<',SQLSTATE,SQLERRM,_c;
		RETURN QUERY EXECUTE 'SELECT NULL::DATE as clock_day, NULL::UUID as user_id, NULL::TEXT as notice, NULL as clock_type, NULL::TEXT as start_time, NULL::TEXT as end_time, NULL::INT as raw_minutes, NULL::INT as minutes_on_break, NULL::INT as billable_minutes';
	WHEN OTHERS THEN
		GET STACKED DIAGNOSTICS _c = PG_EXCEPTION_CONTEXT;
		RAISE EXCEPTION '[report_punches_for_single_user FAILED] - UDF ERROR [OTHER] - SQLSTATE: %, SQLERRM: %, CONTEXT: >> % <<',SQLSTATE,SQLERRM,_c;
		RETURN QUERY EXECUTE 'SELECT NULL::DATE as clock_day, NULL::UUID as user_id, NULL::TEXT as notice, NULL as clock_type, NULL::TEXT as start_time, NULL::TEXT as end_time, NULL::INT as raw_minutes, NULL::INT as minutes_on_break, NULL::INT as billable_minutes';
END
$BODY$;

ALTER FUNCTION public.report_punches_for_single_user(seek_user_id uuid, start_date date, end_date date) OWNER TO "bontime_rest_api_data_user";
GRANT EXECUTE ON FUNCTION public.report_punches_for_single_user(seek_user_id uuid, start_date date, end_date date) TO "bontime_users";
-- Report Punches For List of Users
CREATE OR REPLACE FUNCTION public.report_punches_for_list_of_users(seek_user_ids uuid[], start_date date, end_date date)
    RETURNS TABLE(clock_day date, user_id uuid, notice text, clock_type punch_types, start_time text, end_time text, raw_minutes int, minutes_on_break int, billable_minutes int)
    LANGUAGE 'plpgsql'
    COST 100
    VOLATILE 
	ROWS 1000
AS $BODY$
DECLARE
	start_epoch double precision;
	end_epoch double precision;
	cur_usr uuid;
	_c text;
BEGIN

	-- Ensure Start Date <=  End Date
	IF start_date > end_date THEN
		RAISE EXCEPTION 'Start Date Cannot Be Greater Than End Date';
	ELSE
		RAISE NOTICE 'Start Date: % < End Date: %', start_date, end_date;
	END IF;
	
	DROP TABLE IF EXISTS temp_report_multi_user_result_table;
	
	CREATE TEMPORARY TABLE temp_report_multi_user_result_table (
		clock_day date, 
		user_id uuid, 
		notice text, 
		clock_type punch_types, 
		start_time text, 
		end_time text, 
		tmp_raw_minutes int, 
		tmp_minutes_on_break int, 
		tmp_billable_minutes int
	);
	-- Perform Action Per Day
	FOR cur_usr IN SELECT UNNEST(seek_user_ids)
	LOOP
		RAISE NOTICE 'Current Records For: %', cur_usr;
		INSERT INTO temp_report_multi_user_result_table(clock_day, user_id, notice, clock_type, start_time, end_time, tmp_raw_minutes, tmp_minutes_on_break, tmp_billable_minutes)
			SELECT * FROM public.report_punches_for_single_user(cur_usr::UUID, start_date::DATE, end_date::DATE);
	END LOOP;
	
	RETURN QUERY EXECUTE 'SELECT trep.clock_day, trep.user_id, trep.notice, trep.clock_type, trep.start_time, trep.end_time, trep.tmp_raw_minutes as raw_minutes, trep.tmp_minutes_on_break as minutes_on_break, trep.tmp_billable_minutes as billable_minutes FROM temp_report_multi_user_result_table as trep';

EXCEPTION
	WHEN data_exception THEN
		GET STACKED DIAGNOSTICS _c = PG_EXCEPTION_CONTEXT;
		RAISE EXCEPTION '[report_punches_for_list_of_users FAILED] - UDF ERROR [DATA EXCEPTION] - SQLSTATE: %, SQLERRM: %, CONTEXT: >> % <<',SQLSTATE,SQLERRM,_c;
		RETURN QUERY EXECUTE 'SELECT NULL::DATE as clock_day, NULL::UUID as user_id, NULL::TEXT as notice, NULL as clock_type, NULL::TEXT as start_time, NULL::TEXT as end_time, NULL::INT as raw_minutes, NULL::INT as minutes_on_break, NULL::INT as billable_minutes';
	WHEN unique_violation THEN
		GET STACKED DIAGNOSTICS _c = PG_EXCEPTION_CONTEXT;
		RAISE EXCEPTION '[report_punches_for_list_of_users FAILED] - UDF ERROR [UNIQUE] - SQLSTATE: %, SQLERRM: %, CONTEXT: >> % <<',SQLSTATE,SQLERRM,_c;
		RETURN QUERY EXECUTE 'SELECT NULL::DATE as clock_day, NULL::UUID as user_id, NULL::TEXT as notice, NULL as clock_type, NULL::TEXT as start_time, NULL::TEXT as end_time, NULL::INT as raw_minutes, NULL::INT as minutes_on_break, NULL::INT as billable_minutes';
	WHEN OTHERS THEN
		GET STACKED DIAGNOSTICS _c = PG_EXCEPTION_CONTEXT;
		RAISE EXCEPTION '[report_punches_for_list_of_users FAILED] - UDF ERROR [OTHER] - SQLSTATE: %, SQLERRM: %, CONTEXT: >> % <<',SQLSTATE,SQLERRM,_c;
		RETURN QUERY EXECUTE 'SELECT NULL::DATE as clock_day, NULL::UUID as user_id, NULL::TEXT as notice, NULL as clock_type, NULL::TEXT as start_time, NULL::TEXT as end_time, NULL::INT as raw_minutes, NULL::INT as minutes_on_break, NULL::INT as billable_minutes';
END
$BODY$;

ALTER FUNCTION public.report_punches_for_list_of_users(seek_user_ids uuid[], start_date date, end_date date) OWNER TO "bontime_rest_api_data_user";
GRANT EXECUTE ON FUNCTION public.report_punches_for_list_of_users(seek_user_ids uuid[], start_date date, end_date date) TO "bontime_users";

-- Report Punches For All users
CREATE OR REPLACE FUNCTION public.report_punches_for_all_users(start_date date, end_date date)
    RETURNS TABLE(clock_day date, user_id uuid, notice text, clock_type punch_types, start_time text, end_time text, raw_minutes int, minutes_on_break int, billable_minutes int)
    LANGUAGE 'plpgsql'
    COST 100
    VOLATILE 
	ROWS 1000
AS $BODY$
DECLARE
	start_epoch double precision;
	end_epoch double precision;
	cur_usr uuid;
	_c text;
BEGIN

	-- Ensure Start Date <=  End Date
	IF start_date > end_date THEN
		RAISE EXCEPTION 'Start Date Cannot Be Greater Than End Date';
	ELSE
		RAISE NOTICE 'Start Date: % < End Date: %', start_date, end_date;
	END IF;
	
	DROP TABLE IF EXISTS temp_report_multi_user_result_table;
	
	CREATE TEMPORARY TABLE temp_report_multi_user_result_table (
		clock_day date, 
		user_id uuid, 
		notice text, 
		clock_type punch_types, 
		start_time text, 
		end_time text, 
		tmp_raw_minutes int, 
		tmp_minutes_on_break int, 
		tmp_billable_minutes int
	);
	-- Perform Action Per Day
	FOR cur_usr IN SELECT id FROM public.users
	LOOP
		RAISE NOTICE 'Current Records For: %', cur_usr;
		INSERT INTO temp_report_multi_user_result_table(clock_day, user_id, notice, clock_type, start_time, end_time, tmp_raw_minutes, tmp_minutes_on_break, tmp_billable_minutes)
			SELECT * FROM public.report_punches_for_single_user(cur_usr::UUID, start_date::DATE, end_date::DATE);
	END LOOP;
	
	RETURN QUERY EXECUTE 'SELECT trep.clock_day, trep.user_id, trep.notice, trep.clock_type, trep.start_time, trep.end_time, trep.tmp_raw_minutes as raw_minutes, trep.tmp_minutes_on_break as minutes_on_break, trep.tmp_billable_minutes as billable_minutes FROM temp_report_multi_user_result_table as trep';

EXCEPTION
	WHEN data_exception THEN
		GET STACKED DIAGNOSTICS _c = PG_EXCEPTION_CONTEXT;
		RAISE EXCEPTION '[report_punches_for_all_users FAILED] - UDF ERROR [DATA EXCEPTION] - SQLSTATE: %, SQLERRM: %, CONTEXT: >> % <<',SQLSTATE,SQLERRM,_c;
		RETURN QUERY EXECUTE 'SELECT NULL::DATE as clock_day, NULL::UUID as user_id, NULL::TEXT as notice, NULL as clock_type, NULL::TEXT as start_time, NULL::TEXT as end_time, NULL::INT as raw_minutes, NULL::INT as minutes_on_break, NULL::INT as billable_minutes';
	WHEN unique_violation THEN
		GET STACKED DIAGNOSTICS _c = PG_EXCEPTION_CONTEXT;
		RAISE EXCEPTION '[report_punches_for_all_users FAILED] - UDF ERROR [UNIQUE] - SQLSTATE: %, SQLERRM: %, CONTEXT: >> % <<',SQLSTATE,SQLERRM,_c;
		RETURN QUERY EXECUTE 'SELECT NULL::DATE as clock_day, NULL::UUID as user_id, NULL::TEXT as notice, NULL as clock_type, NULL::TEXT as start_time, NULL::TEXT as end_time, NULL::INT as raw_minutes, NULL::INT as minutes_on_break, NULL::INT as billable_minutes';
	WHEN OTHERS THEN
		GET STACKED DIAGNOSTICS _c = PG_EXCEPTION_CONTEXT;
		RAISE EXCEPTION '[report_punches_for_all_users FAILED] - UDF ERROR [OTHER] - SQLSTATE: %, SQLERRM: %, CONTEXT: >> % <<',SQLSTATE,SQLERRM,_c;
		RETURN QUERY EXECUTE 'SELECT NULL::DATE as clock_day, NULL::UUID as user_id, NULL::TEXT as notice, NULL as clock_type, NULL::TEXT as start_time, NULL::TEXT as end_time, NULL::INT as raw_minutes, NULL::INT as minutes_on_break, NULL::INT as billable_minutes';
END
$BODY$;

ALTER FUNCTION public.report_punches_for_all_users(start_date date, end_date date) OWNER TO "bontime_rest_api_data_user";
GRANT EXECUTE ON FUNCTION public.report_punches_for_all_users(start_date date, end_date date) TO "bontime_users";

-- Function To Fetch Status For Every User
CREATE OR REPLACE FUNCTION public.get_all_user_statuses()
    RETURNS TABLE(
		punch_id uuid, 
	  	punch_type punch_types, 
		timesheet_id uuid, 
		event_date double precision, 
		clock_day date, 
		punch_event_id uuid, 
		clock_time text, 
		type punch_event_type, 
		for_interval interval,
		current_status text
				 )
    LANGUAGE 'plpgsql'
    COST 100
    VOLATILE 
	ROWS 1000
AS $BODY$
DECLARE
	current_epoch double precision;
	end_epoch double precision;
	cur_usr uuid;
	_c text;
BEGIN
	-- Ensure Start Date <=  End Date
	DROP TABLE IF EXISTS tmp_status_all_users;
	
	CREATE TEMPORARY TABLE tmp_status_all_users(
		punch_id uuid, 
	  	punch_type punch_types, 
		timesheet_id uuid, 
		event_date double precision, 
		clock_day date, 
		punch_event_id uuid, 
		clock_time text, 
		type punch_event_type, 
		for_interval interval,
		current_status text
	);
	 
	 
	-- Perform Action Per Day
	FOR cur_usr IN SELECT id FROM public.users
	LOOP
		WITH seek AS (
			 SELECT timezone('utc'::text, to_timestamp(date_part('epoch'::text, current_setting('loc.seek_time'::text)::timestamp without time zone))) AS seek_tstamp,
				timezone('utc'::text, to_timestamp(date_part('epoch'::text, current_setting('loc.seek_time'::text)::timestamp without time zone)))::date AS seek_date,
				date_part('epoch'::text, current_setting('loc.seek_time'::text)::timestamp without time zone) AS seek_epoch
		), selected_punch AS (
			 SELECT punches.id,
				punches.punch_type,
				punches.timesheet_id,
				punches.event_date,
				timezone('utc'::text, to_timestamp(punches.event_date))::date AS clock_day
			   FROM punches
			  WHERE (( SELECT seek.seek_date FROM seek)) = timezone('utc'::text, to_timestamp(punches.event_date))::date 
				AND punches.user_id = cur_usr::uuid
		)
		INSERT INTO tmp_status_all_users(punch_id, punch_type, timesheet_id, event_date, clock_day, punch_event_id, clock_time, type, for_interval, current_status)
			 SELECT p.id AS punch_id,
				p.punch_type,
				p.timesheet_id,
				p.event_date,
				p.clock_day,
				pe.id AS punch_event_id,
				TO_CHAR(timezone('utc'::text, to_timestamp(pe.entry))::TIMESTAMP, 'hh12:mi AM')::TEXT  AS clock_time,
				pe.type,
				(( SELECT seek.seek_tstamp
					   FROM seek)) - timezone('utc'::text, to_timestamp(pe.entry)) AS for_interval,
					CASE
						WHEN pe.type = 'BIN'::punch_event_type THEN 'On Break'::text
						WHEN pe.type = 'BOUT'::punch_event_type THEN 'Back From Break'::text
						WHEN pe.type = 'IN'::punch_event_type THEN 'Clocked In'::text
						ELSE 'Clocked Out'::text
					END AS current_status
			   FROM selected_punch p
				 LEFT JOIN punch_events pe ON pe.punch_id = p.id
			  WHERE (( SELECT seek.seek_tstamp FROM seek)) >= timezone('utc'::text, to_timestamp(pe.entry))
			  ORDER BY pe.entry DESC
			 LIMIT 1;
	END LOOP;
	
	RETURN QUERY EXECUTE 'SELECT trep.punch_id, trep.punch_type, trep.timesheet_id, trep.event_date, trep.clock_day, trep.punch_event_id, trep.clock_time, trep.type, trep.for_interval, trep.current_status FROM tmp_status_all_users as trep';

EXCEPTION
	WHEN data_exception THEN
		GET STACKED DIAGNOSTICS _c = PG_EXCEPTION_CONTEXT;
		RAISE EXCEPTION '[report_punches_for_all_users FAILED] - UDF ERROR [DATA EXCEPTION] - SQLSTATE: %, SQLERRM: %, CONTEXT: >> % <<',SQLSTATE,SQLERRM,_c;
		RETURN QUERY EXECUTE 'SELECT NULL as punch_id, NULL as punch_type, NULL as timesheet_id, NULL as event_date, NULL as clock_day, NULL as punch_event_id, NULL as clock_time, NULL as type, NULL as for_interval, NULL as current_status';
	WHEN unique_violation THEN
		GET STACKED DIAGNOSTICS _c = PG_EXCEPTION_CONTEXT;
		RAISE EXCEPTION '[get_all_user_statuses FAILED] - UDF ERROR [UNIQUE] - SQLSTATE: %, SQLERRM: %, CONTEXT: >> % <<',SQLSTATE,SQLERRM,_c;
		RETURN QUERY EXECUTE 'SELECT NULL as punch_id, NULL as punch_type, NULL as timesheet_id, NULL as event_date, NULL as clock_day, NULL as punch_event_id, NULL as clock_time, NULL as type, NULL as for_interval, NULL as current_status';
	WHEN OTHERS THEN
		GET STACKED DIAGNOSTICS _c = PG_EXCEPTION_CONTEXT;
		RAISE EXCEPTION '[get_all_user_statuses FAILED] - UDF ERROR [OTHER] - SQLSTATE: %, SQLERRM: %, CONTEXT: >> % <<',SQLSTATE,SQLERRM,_c;
		RETURN QUERY EXECUTE 'SELECT NULL as punch_id, NULL as punch_type, NULL as timesheet_id, NULL as event_date, NULL as clock_day, NULL as punch_event_id, NULL as clock_time, NULL as type, NULL as for_interval, NULL as current_status';
END
$BODY$;

ALTER FUNCTION public.get_all_user_statuses() OWNER TO "bontime_rest_api_data_user";
GRANT EXECUTE ON FUNCTION public.get_all_user_statuses() TO "bontime_users";
```

Explore The Database, Its Up And Running