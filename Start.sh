
#!/bin/bash
if [ ! -z "$AUTH_TAR_B64" ]; then
    echo "Extracting AUTH_TAR_B64..."
    echo $AUTH_TAR_B64 | base64 -d | tar xvfz - -C ./auth
fi

echo "Starting IanMegaBot..."
node index.js
