#!/bin/sh
set -e

: "${API_BASE_URL:=}"

cat >/usr/share/nginx/html/config.js <<EOF
window.__HILBERT_CONFIG__ = { API_BASE_URL: "${API_BASE_URL}" };
EOF

exec nginx -g "daemon off;"
