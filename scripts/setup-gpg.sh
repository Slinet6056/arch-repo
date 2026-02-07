#!/bin/bash
# Setup GPG for database signing in CI environment

set -e

if [ "$GPG_ENABLED" != "true" ] || [ -z "$GPG_PRIVATE_KEY" ]; then
    echo "GPG signing is not enabled or GPG_PRIVATE_KEY is not set"
    exit 0
fi

echo "Setting up GPG for database signing..."

# Create GPG directory
mkdir -p ~/.gnupg
chmod 700 ~/.gnupg

# Import GPG private key
echo "$GPG_PRIVATE_KEY" | gpg --batch --import 2>&1

# Configure GPG for batch mode with passphrase file
cat > ~/.gnupg/gpg.conf <<EOF
batch
yes
pinentry-mode loopback
passphrase-file /repo/.gpg-passphrase
EOF

cat > ~/.gnupg/gpg-agent.conf <<EOF
allow-loopback-pinentry
max-cache-ttl 86400
default-cache-ttl 86400
EOF

# Get and export the key ID
KEY_ID=$(gpg --list-secret-keys --with-colons | grep '^sec' | cut -d: -f5)
echo "Using GPG key: $KEY_ID"
if [ -n "${GITHUB_ENV:-}" ]; then
    echo "GPGKEY=$KEY_ID" >> "$GITHUB_ENV"
else
    export GPGKEY="$KEY_ID"
fi

echo "GPG setup complete"
