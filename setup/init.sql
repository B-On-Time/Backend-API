
CREATE EXTENSION "uuid-ossp" SCHEMA public;
CREATE ROLE "bontime_users" WITH NOLOGIN NOSUPERUSER INHERIT NOCREATEDB NOCREATEROLE NOREPLICATION;
  
ALTER DEFAULT PRIVILEGES IN SCHEMA public
GRANT ALL ON TABLES TO "bontime_users";

ALTER DEFAULT PRIVILEGES IN SCHEMA public
GRANT ALL ON SEQUENCES TO "bontime_users";

ALTER DEFAULT PRIVILEGES IN SCHEMA public
GRANT EXECUTE ON FUNCTIONS TO "bontime_users";

ALTER DEFAULT PRIVILEGES IN SCHEMA public
GRANT USAGE ON TYPES TO "bontime_users";

CREATE USER "bontime_rest_api_data_user" WITH
  LOGIN
  NOSUPERUSER
  INHERIT
  CREATEDB
  CREATEROLE
  REPLICATION;

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

