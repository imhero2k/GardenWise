#!/usr/bin/env python3
"""Copy public schema/data from an existing GardenWise PostgreSQL DB into EMPTY RDS."""
import getpass
import os
from pathlib import Path
import subprocess
import tempfile
from psycopg.conninfo import conninfo_to_dict
from init_db import admin_connect


def main():
    source = getpass.getpass('Existing/source PostgreSQL URL (hidden): ')
    target, conn = admin_connect()
    with conn:
        with conn.cursor() as cur:
            cur.execute("SELECT count(*) FROM information_schema.tables WHERE table_schema='public' AND table_type='BASE TABLE' AND table_name <> 'spatial_ref_sys'")
            if cur.fetchone()[0]:
                raise SystemExit('Target public schema is not empty. Refusing to overwrite it. Do not run init_db.py before the dump/restore path.')
            # A schema-filtered dump may omit extension creation. Install it first.
            cur.execute('CREATE EXTENSION IF NOT EXISTS postgis')
    ca = str(Path(__file__).with_name('rds-ca.pem'))
    with tempfile.TemporaryDirectory(prefix='gardenwise-copy-') as tmp:
        archive = str(Path(tmp) / 'gardenwise.dump')
        src_env = {**os.environ, 'PGDATABASE': source, 'PGCONNECT_TIMEOUT': '15'}
        # pg_dump 17 can dump source PostgreSQL <=17. Source SSL settings come from its URL.
        print('Exporting source public schema and data...')
        subprocess.run(['pg_dump', '--format=custom', '--schema=public', '--no-owner', '--no-acl', '--file', archive], env=src_env, check=True)
        params = conninfo_to_dict(target)
        dst_env = {**os.environ, 'PGDATABASE': params['dbname'], 'PGHOST': params['host'],
                   'PGPORT': params.get('port', '5432'), 'PGUSER': params['user'],
                   'PGPASSWORD': params['password'], 'PGSSLMODE': 'verify-full',
                   'PGSSLROOTCERT': ca, 'PGCONNECT_TIMEOUT': '15'}
        print('Restoring into private RDS; this may take several minutes...')
        subprocess.run(['pg_restore', '--dbname', params['dbname'], '--no-owner', '--no-privileges', '--exit-on-error', '--single-transaction', archive], env=dst_env, check=True)
    print('Copy complete; temporary dump removed. Run init_db.py --grants-only next.')


if __name__ == '__main__':
    main()
