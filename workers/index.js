/**
 * Cloudflare Worker for arch-repo
 * Handles package downloads, API endpoints, frontend serving, and cleanup
 */

import { HTML_TEMPLATE } from "./html.js";
import { CSS_TEMPLATE } from "./css.js";
import { JS_TEMPLATE } from "./js.js";

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const path = url.pathname;

    // CORS headers
    const corsHeaders = {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, HEAD, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
    };

    // Handle CORS preflight
    if (request.method === "OPTIONS") {
      return new Response(null, { headers: corsHeaders });
    }

    // API: List all packages
    if (path === "/api/packages") {
      return await listPackages(env.R2_BUCKET, corsHeaders);
    }

    // API: Search packages
    if (path === "/api/search") {
      const query = url.searchParams.get("q");
      return await searchPackages(env.R2_BUCKET, query, corsHeaders);
    }

    // API: Get package info
    if (path.startsWith("/api/package/")) {
      const pkgName = path.replace("/api/package/", "");
      return await getPackageInfo(env.R2_BUCKET, pkgName, corsHeaders);
    }

    // API: Cleanup old versions (authenticated endpoint)
    if (path === "/api/cleanup" && request.method === "POST") {
      return await cleanupOldVersions(request, env, corsHeaders);
    }

    // Download package files (*.pkg.tar.zst, *.sig, *.db.tar.gz, etc.)
    if (
      path.match(/\.(pkg\.tar\.zst|sig|db\.tar\.gz|db|files\.tar\.gz|files)$/)
    ) {
      return await serveFromR2(env.R2_BUCKET, path);
    }

    // Serve static frontend files
    if (path === "/" || path === "/index.html") {
      return new Response(HTML_TEMPLATE, {
        headers: {
          "Content-Type": "text/html; charset=utf-8",
          "Cache-Control": "public, max-age=3600",
        },
      });
    }

    if (path === "/style.css") {
      return new Response(CSS_TEMPLATE, {
        headers: {
          "Content-Type": "text/css; charset=utf-8",
          "Cache-Control": "public, max-age=86400",
        },
      });
    }

    if (path === "/app.js") {
      return new Response(JS_TEMPLATE, {
        headers: {
          "Content-Type": "application/javascript; charset=utf-8",
          "Cache-Control": "public, max-age=86400",
        },
      });
    }

    return new Response("Not Found", { status: 404 });
  },
};

/**
 * Serve file from R2 storage
 */
async function serveFromR2(bucket, path) {
  const key = path.startsWith("/") ? path.slice(1) : path;
  const object = await bucket.get(key);

  if (!object) {
    return new Response("Not Found", { status: 404 });
  }

  const headers = new Headers();

  // Set appropriate Content-Type based on file extension
  if (key.endsWith(".pkg.tar.zst")) {
    headers.set("Content-Type", "application/zstd");
    headers.set("Cache-Control", "public, max-age=31536000, immutable");
  } else if (key.endsWith(".db.tar.gz") || key.endsWith(".files.tar.gz")) {
    headers.set("Content-Type", "application/gzip");
    headers.set("Cache-Control", "public, max-age=300");
  } else if (key.endsWith(".db") || key.endsWith(".files")) {
    headers.set("Content-Type", "application/gzip");
    headers.set("Cache-Control", "public, max-age=300");
  } else if (key.endsWith(".sig")) {
    headers.set("Content-Type", "application/octet-stream");
    headers.set("Cache-Control", "public, max-age=31536000, immutable");
  }

  headers.set("Content-Length", object.size);
  headers.set("ETag", object.httpEtag);

  return new Response(object.body, { headers });
}

/**
 * List all available packages
 */
async function listPackages(bucket, corsHeaders) {
  try {
    const listed = await bucket.list();

    const packages = listed.objects
      .filter((obj) => obj.key.endsWith(".pkg.tar.zst"))
      .map((obj) => {
        const filename = obj.key.split("/").pop();
        // Parse package filename: pkgname-version-release-arch.pkg.tar.zst
        const match = filename.match(
          /^(.+?)-([^-]+)-([^-]+)-([^.]+)\.pkg\.tar\.zst$/,
        );

        if (match) {
          return {
            name: match[1],
            version: match[2],
            release: match[3],
            arch: match[4],
            size: obj.size,
            uploaded: obj.uploaded,
            url: `/${obj.key}`,
            downloadUrl: `https://arch.slinet.moe/${obj.key}`,
          };
        }
        return null;
      })
      .filter(Boolean)
      .sort((a, b) => b.uploaded - a.uploaded);

    return new Response(JSON.stringify(packages, null, 2), {
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json",
        "Cache-Control": "public, max-age=300",
      },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json",
      },
    });
  }
}

/**
 * Search packages by name or description
 */
async function searchPackages(bucket, query, corsHeaders) {
  if (!query) {
    return new Response(JSON.stringify({ error: "Missing query parameter" }), {
      status: 400,
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json",
      },
    });
  }

  try {
    const listed = await bucket.list();
    const lowerQuery = query.toLowerCase();

    const packages = listed.objects
      .filter((obj) => obj.key.toLowerCase().includes(lowerQuery))
      .map((obj) => ({
        key: obj.key,
        size: obj.size,
        uploaded: obj.uploaded,
        url: `/${obj.key}`,
      }));

    return new Response(JSON.stringify(packages, null, 2), {
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json",
        "Cache-Control": "public, max-age=60",
      },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json",
      },
    });
  }
}

/**
 * Get detailed information about a specific package
 */
async function getPackageInfo(bucket, pkgName, corsHeaders) {
  try {
    const listed = await bucket.list();

    const versions = listed.objects
      .filter((obj) => obj.key.startsWith(pkgName + "-"))
      .filter((obj) => obj.key.endsWith(".pkg.tar.zst"))
      .map((obj) => {
        const filename = obj.key.split("/").pop();
        const match = filename.match(
          /^(.+?)-([^-]+)-([^-]+)-([^.]+)\.pkg\.tar\.zst$/,
        );

        if (match) {
          return {
            name: match[1],
            version: match[2],
            release: match[3],
            arch: match[4],
            size: obj.size,
            uploaded: obj.uploaded,
            url: `/${obj.key}`,
          };
        }
        return null;
      })
      .filter(Boolean)
      .sort((a, b) => b.uploaded - a.uploaded);

    if (versions.length === 0) {
      return new Response(JSON.stringify({ error: "Package not found" }), {
        status: 404,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      });
    }

    return new Response(
      JSON.stringify(
        {
          name: pkgName,
          versions: versions,
          latest: versions[0],
        },
        null,
        2,
      ),
      {
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
          "Cache-Control": "public, max-age=300",
        },
      },
    );
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json",
      },
    });
  }
}

/**
 * Cleanup old package versions, keeping only the latest N versions
 * Requires authentication via Authorization header
 */
async function cleanupOldVersions(request, env, corsHeaders) {
  try {
    // Verify authentication
    const authHeader = request.headers.get("Authorization");
    if (!authHeader || authHeader !== `Bearer ${env.CLEANUP_TOKEN}`) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      });
    }

    // Get keep_versions from request body, default to 2
    const body = await request.json().catch(() => ({}));
    const keepVersions = body.keep_versions || 2;

    // List all packages from R2
    const listed = await env.R2_BUCKET.list();
    const packageFiles = listed.objects.filter((obj) =>
      obj.key.endsWith(".pkg.tar.zst"),
    );

    // Group packages by name
    const packageGroups = {};
    for (const file of packageFiles) {
      const filename = file.key.split("/").pop();
      const match = filename.match(
        /^(.+?)-([^-]+)-([^-]+)-([^.]+)\.pkg\.tar\.zst$/,
      );

      if (match) {
        const pkgName = match[1];
        if (!packageGroups[pkgName]) {
          packageGroups[pkgName] = [];
        }
        packageGroups[pkgName].push({
          key: file.key,
          version: match[2],
          release: match[3],
          uploaded: file.uploaded,
        });
      }
    }

    // Delete old versions
    const deletedFiles = [];
    for (const [pkgName, versions] of Object.entries(packageGroups)) {
      // Sort by upload time, newest first
      versions.sort((a, b) => new Date(b.uploaded) - new Date(a.uploaded));

      // Keep only the latest N versions, delete the rest
      const toDelete = versions.slice(keepVersions);

      for (const pkg of toDelete) {
        // Delete package file
        await env.R2_BUCKET.delete(pkg.key);
        deletedFiles.push(pkg.key);

        // Delete signature file if exists
        const sigKey = `${pkg.key}.sig`;
        const sigExists = await env.R2_BUCKET.head(sigKey);
        if (sigExists) {
          await env.R2_BUCKET.delete(sigKey);
          deletedFiles.push(sigKey);
        }
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        deleted: deletedFiles.length,
        files: deletedFiles,
        message: `Cleaned up ${deletedFiles.length} old files, keeping ${keepVersions} versions per package`,
      }),
      {
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      },
    );
  } catch (error) {
    return new Response(
      JSON.stringify({
        error: error.message,
        stack: error.stack,
      }),
      {
        status: 500,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      },
    );
  }
}
