#!/bin/sh
#
# First, cd to the correct folder i.e.
# cd Desktop/GatSim/Code/TonometrySimulation
# To change the permissions of this file so it can be run in terminal, do
# chmod 755 <filename>.sh
# chmod 755 scripts/run_http_server.sh
# to run
# ./scripts/run_http_server.sh
#
# This file allows you to include the http server so you can access the files
# via http://localhost:port/url. This is better than directly accessing the file
# like file:url because CORS will not be blocked; thus files can reference other
# files.
#
# **************
# cd Desktop/GatSim/Code/TonometrySimulation
# ./scripts/run_http_server.sh
# Go to http://localhost:8000/src/v009
# **************

# PORT can be passed in; otherwise, default value will be used
# https://linuxhandbook.com/bash-arguments/
PORT=${1:-"8000"}

# https://stackoverflow.com/questions/10752055/cross-origin-requests-are-only-supported-for-http-error-when-loading-a-local
# Assume home folder is TonometrySimulation/
echo Creating server at http://localhost:$PORT/
python3 -m http.server $PORT   # Assuming python version 3
echo Created server at http://localhost:$PORT/
