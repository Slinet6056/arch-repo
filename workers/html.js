export const HTML_TEMPLATE = `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>arch-repo - Arch Linux Package Repository</title>
    <link rel="stylesheet" href="style.css" />
    <link
      rel="icon"
      href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>📦</text></svg>"
    />
  </head>
  <body>
    <header>
      <div class="container">
        <h1>arch-repo</h1>
        <p class="subtitle">
          High-performance Arch Linux package repository powered by Cloudflare
        </p>
      </div>
    </header>

    <main class="container">
      <section class="usage">
        <h2>Usage</h2>
        <div class="code-block">
          <div class="code-header">
            <span>/etc/pacman.conf</span>
            <button class="copy-btn" onclick="copyCode(this)">Copy</button>
          </div>
          <pre><code>[arch-repo]
SigLevel = Optional TrustAll
Server = https://arch.slinet.moe</code></pre>
        </div>
        <p class="hint">
          After adding the configuration, run
          <code>sudo pacman -Sy</code> to update the package database.
        </p>
      </section>

      <section class="packages">
        <h2>Available Packages</h2>
        <div class="search-box">
          <input
            type="text"
            id="search"
            placeholder="Search packages..."
            autocomplete="off"
          />
        </div>
        <div id="package-list" class="package-grid">
          <div class="loading">Loading packages...</div>
        </div>
      </section>

      <section class="stats" id="stats">
        <h2>Repository Info</h2>
        <div class="stats-grid">
          <div class="stat-card">
            <span class="stat-value" id="total-packages">-</span>
            <span class="stat-label">Packages</span>
          </div>
          <div class="stat-card">
            <span class="stat-value" id="total-size">-</span>
            <span class="stat-label">Total Size</span>
          </div>
          <div class="stat-card">
            <span class="stat-value" id="last-updated">-</span>
            <span class="stat-label">Last Updated</span>
          </div>
        </div>
      </section>
    </main>

    <footer>
      <div class="container">
        <p>
          Auto-built by
          <a href="https://github.com/Slinet6056/arch-repo">GitHub Actions</a>
          &middot; Powered by
          <a href="https://www.cloudflare.com">Cloudflare Workers</a>
        </p>
      </div>
    </footer>

    <script src="app.js"></script>
  </body>
</html>
`;
