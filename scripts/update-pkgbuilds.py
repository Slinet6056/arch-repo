#!/usr/bin/env python3
"""
Update PKGBUILD files based on nvchecker results.

This script:
1. Reads new version information from /tmp/newver (nvchecker output)
2. Finds corresponding PKGBUILD files in src/
3. Updates pkgver and resets pkgrel to 1
4. Runs updpkgsums to recalculate checksums
5. Generates a commit message for the updates
"""

import json
import re
import subprocess
import sys
from pathlib import Path


def read_nvchecker_results(newver_file: Path) -> dict[str, str]:
    """Read nvchecker results and return dict of {package: version}."""
    if not newver_file.exists():
        print("No updates needed")
        return {}

    content = newver_file.read_text().strip()

    # Try to parse as JSON (nvchecker v2 format)
    try:
        data = json.loads(content)
        if isinstance(data, dict) and "data" in data:
            # New JSON format: {"version": 2, "data": {"pkg": {"version": "1.0"}}}
            return {pkg: info["version"] for pkg, info in data["data"].items()}
    except json.JSONDecodeError:
        pass

    # Fallback to plain text format (old nvchecker format)
    updates = {}
    for line in content.splitlines():
        if line.strip():
            pkg, version = line.split(None, 1)
            updates[pkg] = version

    return updates


def find_pkgbuild(pkg_name: str) -> Path | None:
    """Find PKGBUILD file for the given package name."""
    for pkgbuild_path in Path("src").rglob("PKGBUILD"):
        content = pkgbuild_path.read_text()
        if re.search(rf"^pkgname={pkg_name}$", content, re.MULTILINE):
            return pkgbuild_path
    return None


def update_pkgbuild(pkgbuild_path: Path, new_version: str) -> tuple[bool, str]:
    """
    Update PKGBUILD with new version.

    Returns:
        (success: bool, old_version: str)
    """
    content = pkgbuild_path.read_text()

    # Extract current version
    current_ver_match = re.search(r"^pkgver=(.+)$", content, re.MULTILINE)
    if not current_ver_match:
        print(f"Warning: Cannot find pkgver in {pkgbuild_path}")
        return False, ""

    current_version = current_ver_match.group(1).strip("'\"")

    if current_version == new_version:
        print(f"Already at version {new_version}")
        return False, current_version

    print(f"Updating: {current_version} -> {new_version}")

    # Update pkgver
    content = re.sub(
        r"^pkgver=.+$", f"pkgver={new_version}", content, count=1, flags=re.MULTILINE
    )

    # Reset pkgrel to 1
    content = re.sub(r"^pkgrel=.+$", "pkgrel=1", content, count=1, flags=re.MULTILINE)

    # Write back
    pkgbuild_path.write_text(content)
    return True, current_version


def update_checksums(pkg_dir: Path) -> bool:
    """Run updpkgsums in package directory. Returns True on success."""
    print("Updating checksums...")
    try:
        # Check if running as root
        if subprocess.run(["id", "-u"], capture_output=True, text=True).stdout.strip() == "0":
            # Running as root - use builduser
            subprocess.run(
                ["sudo", "-u", "builduser", "updpkgsums"],
                cwd=pkg_dir,
                check=True,
                capture_output=True,
                text=True,
            )
        else:
            # Not root - run directly
            subprocess.run(
                ["updpkgsums"], cwd=pkg_dir, check=True, capture_output=True, text=True
            )
        return True
    except subprocess.CalledProcessError as e:
        print(f"Error updating checksums: {e.stderr}")
        return False


def rollback_changes(pkgbuild_path: Path):
    """Rollback changes to PKGBUILD using git."""
    try:
        subprocess.run(["git", "checkout", str(pkgbuild_path)], check=True, capture_output=True)
        print(f"Rolled back changes to {pkgbuild_path}")
    except subprocess.CalledProcessError as e:
        print(f"Warning: Failed to rollback {pkgbuild_path}: {e.stderr.decode()}")
        # Try to restore from HEAD
        try:
            subprocess.run(["git", "restore", str(pkgbuild_path)], check=True, capture_output=True)
            print(f"Restored {pkgbuild_path} using git restore")
        except subprocess.CalledProcessError:
            print(f"Could not restore {pkgbuild_path}, manual cleanup may be needed")


def main():
    """Main entry point."""
    newver_file = Path("/tmp/newver")
    updates = read_nvchecker_results(newver_file)

    if not updates:
        sys.exit(0)

    print(f"Found {len(updates)} packages to update: {updates}")

    updated_packages = []

    for pkg_name, new_version in updates.items():
        print(f"\nProcessing {pkg_name}...")

        # Find PKGBUILD
        pkgbuild_path = find_pkgbuild(pkg_name)
        if not pkgbuild_path:
            print(f"Warning: PKGBUILD not found for {pkg_name}")
            continue

        # Update PKGBUILD
        success, old_version = update_pkgbuild(pkgbuild_path, new_version)
        if not success:
            continue

        # Update checksums
        pkg_dir = pkgbuild_path.parent
        if not update_checksums(pkg_dir):
            rollback_changes(pkgbuild_path)
            continue

        updated_packages.append(f"{pkg_name} to {new_version}")

    # Generate commit message
    if updated_packages:
        commit_msg = "chore: update package versions\n\n"
        commit_msg += "\n".join(updated_packages)
        commit_msg += "\n\nCo-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"

        commit_file = Path("/tmp/commit_message.txt")
        commit_file.write_text(commit_msg)

        print(f"\nSuccessfully updated {len(updated_packages)} package(s)")
        sys.exit(0)
    else:
        print("No packages were updated")
        sys.exit(1)


if __name__ == "__main__":
    main()
