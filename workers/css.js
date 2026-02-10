export const CSS_TEMPLATE = `:root {
  /* Catppuccin Macchiato */
  --bg-primary: #24273a;
  --bg-secondary: #1e2030;
  --bg-card: #363a4f;
  --text-primary: #cad3f5;
  --text-secondary: #a5adcb;
  --accent: #c6a0f6;
  --accent-hover: #b7bdf8;
  --border: #5b6078;
  --success: #a6da95;
  --code-bg: #181926;
}

* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen,
    Ubuntu, Cantarell, sans-serif;
  background: var(--bg-primary);
  color: var(--text-primary);
  line-height: 1.6;
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

.container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 20px;
}

header {
  background: var(--bg-secondary);
  padding: 60px 0;
  text-align: center;
  border-bottom: 1px solid var(--border);
}

header h1 {
  font-size: 3rem;
  font-weight: 700;
  margin-bottom: 10px;
  background: linear-gradient(135deg, var(--accent), var(--accent-hover));
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

header .subtitle {
  color: var(--text-secondary);
  font-size: 1.1rem;
}

main {
  flex: 1;
  padding: 40px 0;
}

section {
  margin-bottom: 35px;
}

h2 {
  font-size: 1.5rem;
  margin-top: 30px;
  margin-bottom: 20px;
  color: var(--text-primary);
  border-bottom: 2px solid var(--accent);
  padding-bottom: 10px;
  display: inline-block;
}

.code-block {
  background: var(--code-bg);
  border-radius: 8px;
  overflow: hidden;
  margin-bottom: 20px;
}

.code-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 15px;
  background: rgba(255, 255, 255, 0.05);
  border-bottom: 1px solid var(--border);
}

.code-header span {
  color: var(--text-secondary);
  font-size: 0.9rem;
}

.copy-btn {
  background: var(--bg-card);
  color: var(--text-secondary);
  border: 1px solid var(--border);
  padding: 5px 12px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.85rem;
  transition: all 0.2s;
}

.copy-btn:hover {
  background: var(--border);
  color: var(--text-primary);
}

.copy-btn.copied {
  background: var(--border);
  color: var(--text-primary);
}

.code-block pre {
  padding: 15px;
  overflow-x: auto;
}

.code-block code {
  font-family: "JetBrains Mono", "Fira Code", monospace;
  font-size: 0.9rem;
  color: var(--text-primary);
}

.hint {
  color: var(--text-secondary);
  font-size: 0.9rem;
  margin-top: 10px;
}

.hint code {
  background: var(--code-bg);
  padding: 2px 6px;
  border-radius: 4px;
  font-family: "JetBrains Mono", "Fira Code", monospace;
}

.search-box {
  margin-bottom: 20px;
}

.search-box input {
  width: 100%;
  max-width: 400px;
  padding: 12px 16px;
  font-size: 1rem;
  border: 2px solid var(--border);
  border-radius: 8px;
  background: var(--bg-secondary);
  color: var(--text-primary);
  transition: border-color 0.2s;
}

.search-box input:focus {
  outline: none;
  border-color: var(--accent);
}

.search-box input::placeholder {
  color: var(--text-secondary);
}

.package-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 20px;
}

.package-card {
  display: block;
  background: var(--bg-card);
  border-radius: 10px;
  padding: 16px;
  border: 1px solid var(--border);
  transition: transform 0.2s, border-color 0.2s, background 0.2s;
  text-decoration: none;
  cursor: pointer;
}

.package-card:hover {
  transform: translateY(-2px);
  border-color: var(--accent);
  background: rgba(198, 160, 246, 0.05);
}

.package-card h3 {
  font-size: 1.2rem;
  margin: 0 0 10px 0;
  color: var(--accent);
  transition: color 0.2s;
}

.package-card:hover h3 {
  color: var(--accent-hover);
}

.package-card .meta {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.package-card .meta span {
  background: rgba(255, 255, 255, 0.1);
  padding: 3px 8px;
  border-radius: 4px;
  font-size: 0.8rem;
  color: var(--text-secondary);
}

.loading {
  text-align: center;
  padding: 40px;
  color: var(--text-secondary);
}

.empty {
  text-align: center;
  padding: 40px;
  color: var(--text-secondary);
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 20px;
}

.stat-card {
  background: var(--bg-card);
  border-radius: 10px;
  padding: 20px;
  text-align: center;
  border: 1px solid var(--border);
}

.stat-value {
  display: block;
  font-size: clamp(1.4rem, 3.5vw, 2rem);
  font-weight: 700;
  line-height: 1.1;
  white-space: nowrap;
  color: var(--accent);
}

.stat-label {
  color: var(--text-secondary);
  font-size: 0.9rem;
}

footer {
  background: var(--bg-secondary);
  padding: 20px 0;
  text-align: center;
  border-top: 1px solid var(--border);
}

footer p {
  color: var(--text-secondary);
  font-size: 0.9rem;
}

footer a {
  color: var(--accent);
  text-decoration: none;
}

footer a:hover {
  text-decoration: underline;
}

@media (max-width: 768px) {
  header {
    padding: 40px 0;
  }

  header h1 {
    font-size: 2rem;
  }

  .package-grid {
    grid-template-columns: 1fr;
  }
}
`;
