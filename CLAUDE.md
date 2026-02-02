# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is an automated Arch Linux package repository system with three core components:

1. **Package sources** (`src/`): Stores PKGBUILD files, one subdirectory per package
2. **GitHub Actions CI/CD** (`.github/workflows/build.yml`): Detects changes, builds packages, uploads to R2
3. **Cloudflare Workers** (`workers/`): Serves package downloads, API endpoints, and web frontend

## Architecture

### Build Pipeline

- GitHub Actions triggers when packages in `src/` are modified
- Uses `Slinet6056/archpkg-build@v1` action to build each changed package
- Built packages (`.pkg.tar.zst` and `.sig`) are uploaded to Cloudflare R2 storage
- Repository database (`slinet.db.tar.gz` and `slinet.files.tar.gz`) is maintained using `repo-add`
- After deployment, old versions are automatically cleaned up (keeps latest 2 versions by default)

### Cloudflare Workers Architecture

The Worker (`workers/index.js`) handles:

- **Package file serving**: Serves `.pkg.tar.zst`, `.sig`, `.db.tar.gz` files directly from R2
- **API endpoints**:
  - `/api/packages` - List all available packages
  - `/api/search?q=<query>` - Search packages
  - `/api/package/<name>` - Get package details
  - `/api/cleanup` (POST) - Cleanup old versions (authenticated)
- **Web frontend**: Static HTML/CSS/JS with templates inlined in `html.js`, `css.js`, `js.js`

R2 storage bucket is connected via the `R2_BUCKET` binding in `wrangler.jsonc`.

## Common Commands

### Worker Development

```bash
cd workers
npm run dev        # Start local dev server (wrangler dev)
npm run deploy     # Deploy to Cloudflare (wrangler deploy)
```

### Adding New Packages

1. Create new directory in `src/<package-name>/`
2. Add `PKGBUILD` file
3. Commit and push - CI will automatically build and deploy

### Manual Build Trigger

```bash
# Trigger build for specific package via GitHub CLI
gh workflow run build.yml -f package=<package-name>
```

### Manual Cleanup

```bash
curl -X POST https://arch.slinet.moe/api/cleanup \
  -H "Authorization: Bearer <CLEANUP_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{"keep_versions": 2}'
```

## Important Configuration

- **Repository name**: `slinet` (defined in `.github/workflows/build.yml` as `REPO_NAME`)
- **Package naming format**: `pkgname-version-release-arch.pkg.tar.zst`
- **Database files**: `slinet.db.tar.gz` and `slinet.files.tar.gz` (with `.db` and `.files` symlinks)
- **Domain**: `arch.slinet.moe`

## Secrets and Environment Variables

Required in GitHub and Cloudflare:

- `GPG_PRIVATE_KEY` / `GPG_PASSPHRASE` - For package signing
- `CLOUDFLARE_ACCESS_KEY_ID` / `CLOUDFLARE_SECRET_ACCESS_KEY` - R2 access credentials
- `CLOUDFLARE_ACCOUNT_ID` - Cloudflare account ID
- `CLEANUP_TOKEN` - Authentication token for cleanup API endpoint
- `GPG_ENABLED` (vars) - Whether to enable GPG signing

## Notes

- Worker uses no npm dependencies - all code is pure JavaScript modules
- Package files use immutable cache (max-age=31536000), database files cached for 5 minutes
- Repository database is updated incrementally on each deployment rather than recreated from scratch
