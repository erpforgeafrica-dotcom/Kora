#!/bin/bash
sudo -u postgres psql -d kora_db -c "\d media_assets"
sudo -u postgres psql -d kora_db -c "SELECT table_name FROM information_schema.tables WHERE table_schema='public' AND table_type='BASE TABLE' ORDER BY table_name;" 
