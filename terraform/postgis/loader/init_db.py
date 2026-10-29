#!/usr/bin/env python3
"""Initialize schema and grant a read-only ECS login; never print the admin URL."""
import argparse
import getpass
import os
from pathlib import Path
import secrets
from urllib.parse import quote, urlsplit
import psycopg
from psycopg import sql


def admin_connect():
    url = os.environ.get('ADMIN_DATABASE_URL') or getpass.getpass('RDS admin DATABASE_URL (hidden): ')
    ca = Path(__file__).with_name('rds-ca.pem')
    if not ca.is_file():
        raise SystemExit('Missing rds-ca.pem; wait for bootstrap or download the AWS RDS CA bundle.')
    return url, psycopg.connect(url, sslmode='verify-full', sslrootcert=str(ca), connect_timeout=15)


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--output', type=Path, default=Path.home() / 'gardenwise.app-url')
    parser.add_argument('--grants-only', action='store_true', help='After pg_restore: do not apply the fresh schema.')
    args = parser.parse_args()
    if args.output.exists():
        raise SystemExit(f'{args.output} already exists. No credentials changed. Preserve it or choose another --output.')
    url, conn = admin_connect()
    user = 'gardenwise_app'
    password = secrets.token_urlsafe(32)
    with conn:
        with conn.cursor() as cur:
            if not args.grants_only:
                cur.execute(Path(__file__).with_name('schema.sql').read_text())
            cur.execute('SELECT 1 FROM pg_roles WHERE rolname = %s', (user,))
            if cur.fetchone():
                raise SystemExit('gardenwise_app already exists. Reuse its existing URL; this script will not rotate a live password.')
            # psycopg.sql safely quotes DDL literals; passwords never enter shell history.
            cur.execute(sql.SQL('CREATE ROLE {} LOGIN PASSWORD {}').format(sql.Identifier(user), sql.Literal(password)))
            cur.execute(sql.SQL('GRANT CONNECT ON DATABASE {} TO {}').format(sql.Identifier(conn.info.dbname), sql.Identifier(user)))
            cur.execute(sql.SQL('GRANT USAGE ON SCHEMA public TO {}').format(sql.Identifier(user)))
            cur.execute(sql.SQL('GRANT SELECT ON ALL TABLES IN SCHEMA public TO {}').format(sql.Identifier(user)))
            cur.execute(sql.SQL('ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT ON TABLES TO {}').format(sql.Identifier(user)))
            cur.execute(sql.SQL('ALTER ROLE {} SET default_transaction_read_only = on').format(sql.Identifier(user)))
            # Create the output before commit so a write failure rolls back role creation.
            host = urlsplit(url).hostname
            if not host:
                raise ValueError('Admin URL must contain an RDS hostname')
            app_url = f'postgresql://{user}:{quote(password, safe="")}@{host}:{conn.info.port}/{quote(conn.info.dbname, safe="")}?sslmode=require'
            fd = os.open(args.output, os.O_WRONLY | os.O_CREAT | os.O_EXCL, 0o600)
            with os.fdopen(fd, 'w') as f:
                f.write(app_url + '\n')
    print(f'Read-only ECS login created. DATABASE_URL saved to {args.output} (mode 600).')
    print('Keep that file until the URL is securely configured in ECS. The admin URL is NOT the ECS URL.')


if __name__ == '__main__':
    main()
