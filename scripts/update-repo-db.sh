#!/bin/bash
# Update repository database with repo-add

set -e

REPO_NAME="${1:-slinet}"

if [ ! -d "/repo" ]; then
    echo "Error: /repo directory not found"
    exit 1
fi

cd /repo

echo "Updating repository database: $REPO_NAME"

# Add each package to the repository database
for pkg in *.pkg.tar.zst; do
    if [ -f "$pkg" ]; then
        if [ "$GPG_ENABLED" = "true" ] && [ -f "$pkg.sig" ]; then
            echo "Adding signed package: $pkg"
            repo-add -s --verify -v "${REPO_NAME}.db.tar.gz" "$pkg"
        else
            echo "Adding package: $pkg"
            repo-add -v "${REPO_NAME}.db.tar.gz" "$pkg"
        fi
    fi
done

# Clean up passphrase file
rm -f .gpg-passphrase

# Create database symlinks for pacman compatibility
ln -sf "${REPO_NAME}.db.tar.gz" "${REPO_NAME}.db"
ln -sf "${REPO_NAME}.files.tar.gz" "${REPO_NAME}.files"

echo "Repository database updated successfully"

# List generated files
echo "Generated files:"
ls -lh "${REPO_NAME}".{db,files}* 2>/dev/null || true
