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

shopt -s nullglob
packages=(*.pkg.tar.zst)
shopt -u nullglob

if [ "${#packages[@]}" -eq 0 ]; then
  echo "No packages found in /repo; nothing to update"
  exit 0
fi

if [ "$GPG_ENABLED" = "true" ]; then
  echo "Adding ${#packages[@]} package(s) and signing repository database"
  repo-add -s -v "${REPO_NAME}.db.tar.gz" "${packages[@]}"

  for db_file in "${REPO_NAME}.db.tar.gz" "${REPO_NAME}.files.tar.gz"; do
    sig_file="${db_file}.sig"
    if [ ! -s "$sig_file" ]; then
      echo "Error: signature file '$sig_file' was not generated or is empty"
      exit 1
    fi
    gpg --batch --verify "$sig_file" "$db_file"
  done
else
  echo "Adding ${#packages[@]} package(s) without database signing"
  repo-add -v "${REPO_NAME}.db.tar.gz" "${packages[@]}"
fi

# Clean up passphrase file
rm -f .gpg-passphrase

# Create database symlinks for pacman compatibility
ln -sf "${REPO_NAME}.db.tar.gz" "${REPO_NAME}.db"
ln -sf "${REPO_NAME}.files.tar.gz" "${REPO_NAME}.files"

echo "Repository database updated successfully"

# List generated files
echo "Generated files:"
ls -lh "${REPO_NAME}".{db,files}* 2>/dev/null || true
