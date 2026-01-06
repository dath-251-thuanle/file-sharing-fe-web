#!/bin/sh

echo "window.__ENV = {" > ./public/env-config.js
echo "  NEXT_PUBLIC_API_URL: \"${NEXT_PUBLIC_API_URL}\"" >> ./public/env-config.js
echo "};" >> ./public/env-config.js

exec "$@"
