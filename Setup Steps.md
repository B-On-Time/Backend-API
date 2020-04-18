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
CREATE ROLE "bontime_users" WITH
  NOLOGIN
  NOSUPERUSER
  INHERIT
  NOCREATEDB
  NOCREATEROLE
  NOREPLICATION;
  
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
	uuser_id uuid NOT NULL,
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

-- JANK THIS SHIT UP
ALTER TABLE public.punches ADD COLUMN user_id uuid NOT NULL;

ALTER TABLE public.punches
    ADD CONSTRAINT user_id_must_be_valid_user FOREIGN KEY (user_id)
    REFERENCES public.users (id) MATCH SIMPLE
    ON UPDATE NO ACTION
    ON DELETE NO ACTION;
CREATE INDEX fki_punches_user_id_must_be_valid_user
    ON public.punches(user_id);

-- PROCEDURE: Generate Password For Administrator

-- Add Core Functions
CREATE OR REPLACE FUNCTION public.clock_in(lookup_user_id uuid, lookup_event_date date, lookup_punch_type punch_types, passed_notes text)
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
		INSERT INTO punch_events(created_by, punch_id, "type", notes, entry) VALUES(cur_user, existing_punch.id, 'IN'::punch_event_type, passed_notes, date_part('epoch'::text, timezone('utc'::text, (now())))) RETURNING id INTO res;
	ELSE
		-- Create New Punches Row
		INSERT INTO punches(created_by, punch_type, event_date, user_id) VALUES(cur_user, lookup_punch_type, event_date_epoch, lookup_user_id) RETURNING id INTO new_punch;
		-- INSERT Punch Event Using The New Punches Item
		INSERT INTO punch_events(created_by, punch_id, "type", notes, entry) VALUES(cur_user, new_punch, 'IN'::punch_event_type, passed_notes, date_part('epoch'::text, timezone('utc'::text, (now())))) RETURNING id INTO res;
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

ALTER FUNCTION public.clock_in(uuid, date, punch_types, text)
    OWNER TO "bontime_rest_api_data_user";

GRANT EXECUTE ON FUNCTION public.clock_in(uuid, date, punch_types, text) TO "bontime_users";


CREATE OR REPLACE FUNCTION public.clock_out(lookup_user_id uuid, lookup_event_date date, lookup_punch_type punch_types, passed_notes text)
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
		INSERT INTO punch_events(created_by, punch_id, "type", notes, entry) VALUES(cur_user, existing_punch.id, 'OUT'::punch_event_type, passed_notes, date_part('epoch'::text, timezone('utc'::text, (now())))) RETURNING id INTO res;
	ELSE
		-- Create New Punches Row
		INSERT INTO punches(created_by, punch_type, event_date, user_id) VALUES(cur_user, lookup_punch_type, event_date_epoch, lookup_user_id) RETURNING id INTO new_punch;
		-- INSERT Punch Event Using The New Punches Item
		INSERT INTO punch_events(created_by, punch_id, "type", notes, entry) VALUES(cur_user, new_punch, 'OUT'::punch_event_type, passed_notes, date_part('epoch'::text, timezone('utc'::text, (now())))) RETURNING id INTO res;
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

ALTER FUNCTION public.clock_out(uuid, date, punch_types, text)
    OWNER TO "bontime_rest_api_data_user";

GRANT EXECUTE ON FUNCTION public.clock_out(uuid, date, punch_types, text) TO "bontime_users";


CREATE OR REPLACE FUNCTION public.break_in(lookup_user_id uuid, lookup_event_date date, lookup_punch_type punch_types, passed_notes text)
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
		INSERT INTO punch_events(created_by, punch_id, "type", notes, entry) VALUES(cur_user, existing_punch.id, 'BIN'::punch_event_type, passed_notes, date_part('epoch'::text, timezone('utc'::text, (now())))) RETURNING id INTO res;
	ELSE
		-- Create New Punches Row
		INSERT INTO punches(created_by, punch_type, event_date, user_id) VALUES(cur_user, lookup_punch_type, event_date_epoch, lookup_user_id) RETURNING id INTO new_punch;
		-- INSERT Punch Event Using The New Punches Item
		INSERT INTO punch_events(created_by, punch_id, "type", notes, entry) VALUES(cur_user, new_punch, 'BIN'::punch_event_type, passed_notes, date_part('epoch'::text, timezone('utc'::text, (now())))) RETURNING id INTO res;
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

ALTER FUNCTION public.break_in(uuid, date, punch_types, text)
    OWNER TO "bontime_rest_api_data_user";

GRANT EXECUTE ON FUNCTION public.break_in(uuid, date, punch_types, text) TO "bontime_users";


CREATE OR REPLACE FUNCTION public.break_out(lookup_user_id uuid, lookup_event_date date, lookup_punch_type punch_types, passed_notes text)
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
		INSERT INTO punch_events(created_by, punch_id, "type", notes, entry) VALUES(cur_user, existing_punch.id, 'BOUT'::punch_event_type, passed_notes, date_part('epoch'::text, timezone('utc'::text, (now())))) RETURNING id INTO res;
	ELSE
		-- Create New Punches Row
		INSERT INTO punches(created_by, punch_type, event_date, user_id) VALUES(cur_user, lookup_punch_type, event_date_epoch, lookup_user_id) RETURNING id INTO new_punch;
		-- INSERT Punch Event Using The New Punches Item
		INSERT INTO punch_events(created_by, punch_id, "type", notes, entry) VALUES(cur_user, new_punch, 'BOUT'::punch_event_type, passed_notes, date_part('epoch'::text, timezone('utc'::text, (now())))) RETURNING id INTO res;
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

ALTER FUNCTION public.break_out(uuid, date, punch_types, text)
    OWNER TO "bontime_rest_api_data_user";

GRANT EXECUTE ON FUNCTION public.break_out(uuid, date, punch_types, text) TO "bontime_users";
```

Explore The Database, Its Up And Running