#!/bin/bash

# Start PostgreSQL
sudo service postgresql start

# Create user if not exists
sudo -u postgres psql <<EOF
CREATE USER "user" WITH PASSWORD 'password';
CREATE DATABASE kora_db OWNER "user";
ALTER USER "user" CREATEDB;
EOF

echo "✅ PostgreSQL user and database created"
