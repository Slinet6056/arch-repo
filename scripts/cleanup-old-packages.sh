#!/bin/bash
set -euo pipefail

KEEP_VERSIONS="${1:-2}"
RCLONE_TARGET="${2:-r2:arch-repo}"
TMP_KEYS_FILE="$(mktemp)"

cleanup() {
	rm -f "$TMP_KEYS_FILE"
}
trap cleanup EXIT

if ! [[ "$KEEP_VERSIONS" =~ ^[0-9]+$ ]] || [ "$KEEP_VERSIONS" -lt 1 ]; then
	echo "Error: keep versions must be a positive integer"
	exit 1
fi

echo "Preparing cleanup list from ${RCLONE_TARGET} (keep ${KEEP_VERSIONS} versions per package)..."

rclone lsjson "$RCLONE_TARGET" --recursive | jq -r --argjson keep "$KEEP_VERSIONS" '
  [ .[]
    | select(.Path | endswith(".pkg.tar.zst"))
    | . as $obj
    | ($obj.Path | split("/") | last) as $filename
    | (try ($filename | capture("^(?<name>.+)-(?<version>[^-]+)-(?<release>[^-]+)-(?<arch>[^.]+)\\.pkg\\.tar\\.zst$")) catch null) as $meta
    | select($meta != null)
    | {
        name: $meta.name,
        key: $obj.Path,
        mod_time: $obj.ModTime,
      }
  ]
  | sort_by(.name)
  | group_by(.name)
  | map(sort_by(.mod_time) | reverse | .[$keep:])
  | flatten
  | .[].key
' >"$TMP_KEYS_FILE"

if [ ! -s "$TMP_KEYS_FILE" ]; then
	echo "No old package versions to delete."
	exit 0
fi

DELETED=0
while IFS= read -r key; do
	[ -z "$key" ] && continue

	rclone deletefile "${RCLONE_TARGET}/${key}"
	echo "Deleted package: ${key}"
	DELETED=$((DELETED + 1))

	sig_key="${key}.sig"
	if rclone lsf "${RCLONE_TARGET}/${sig_key}" >/dev/null 2>&1; then
		rclone deletefile "${RCLONE_TARGET}/${sig_key}"
		echo "Deleted signature: ${sig_key}"
		DELETED=$((DELETED + 1))
	fi
done <"$TMP_KEYS_FILE"

echo "Cleanup finished, deleted ${DELETED} file(s)."
