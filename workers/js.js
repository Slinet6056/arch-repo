export const JS_TEMPLATE = `
let allPackages = [];

async function loadPackages() {
  const container = document.getElementById("package-list");

  try {
    const response = await fetch("/api/packages");
    if (!response.ok) {
      throw new Error(\`HTTP error! status: \${response.status}\`);
    }

    allPackages = await response.json();
    displayPackages(allPackages);
    updateStats(allPackages);
  } catch (error) {
    console.error("Failed to load packages:", error);
    container.innerHTML = \`
      <div class="empty">
        <p>Failed to load packages. Please try again later.</p>
        <p style="font-size: 0.8rem; margin-top: 10px; opacity: 0.7;">\${error.message}</p>
      </div>
    \`;
  }
}

function displayPackages(packages) {
  const container = document.getElementById("package-list");

  if (!packages || packages.length === 0) {
    container.innerHTML = '<div class="empty">No packages available yet.</div>';
    return;
  }

  const latestPackages = {};
  packages.forEach((pkg) => {
    if (
      !latestPackages[pkg.name] ||
      new Date(pkg.uploaded) > new Date(latestPackages[pkg.name].uploaded)
    ) {
      latestPackages[pkg.name] = pkg;
    }
  });

  const uniquePackages = Object.values(latestPackages);

  container.innerHTML = uniquePackages
    .map(
      (pkg) => \`
      <a href="\${pkg.url}" class="package-card">
        <h3>\${escapeHtml(pkg.name)}</h3>
        <div class="meta">
          <span>v\${escapeHtml(pkg.version)}-\${escapeHtml(pkg.release)}</span>
          <span>\${escapeHtml(pkg.arch)}</span>
          <span>\${formatSize(pkg.size)}</span>
        </div>
      </a>
    \`
    )
    .join("");
}

function updateStats(packages) {
  const uniqueNames = new Set(packages.map((p) => p.name));
  document.getElementById("total-packages").textContent = uniqueNames.size;

  const totalSize = packages.reduce((sum, p) => sum + p.size, 0);
  document.getElementById("total-size").textContent = formatSize(totalSize);

  if (packages.length > 0) {
    const latestDate = new Date(
      Math.max(...packages.map((p) => new Date(p.uploaded)))
    );
    document.getElementById("last-updated").textContent = formatDate(latestDate);
  } else {
    document.getElementById("last-updated").textContent = "-";
  }
}

function formatSize(bytes) {
  if (bytes === 0) return "0 B";
  const units = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return (bytes / Math.pow(1024, i)).toFixed(1) + " " + units[i];
}

function formatDate(date) {
  const now = new Date();
  const diff = now - date;
  const minutes = Math.floor(diff / (1000 * 60));
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));

  if (minutes < 1) return "just now";
  if (hours < 1) {
    return minutes === 1 ? "1 minute ago" : \`\${minutes} minutes ago\`;
  }
  if (hours < 24) {
    return hours === 1 ? "1 hour ago" : \`\${hours} hours ago\`;
  }
  if (days < 7) {
    return days === 1 ? "1 day ago" : \`\${days} days ago\`;
  }

  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function escapeHtml(text) {
  const div = document.createElement("div");
  div.textContent = text;
  return div.innerHTML;
}

function copyCode(button) {
  const codeBlock = button.closest(".code-block");
  const code = codeBlock.querySelector("code").textContent;

  navigator.clipboard
    .writeText(code)
    .then(() => {
      const originalText = button.textContent;
      button.textContent = "Copied!";
      button.classList.add("copied");

      setTimeout(() => {
        button.textContent = originalText;
        button.classList.remove("copied");
      }, 2000);
    })
    .catch((err) => {
      console.error("Failed to copy:", err);
    });
}

function filterPackages(query) {
  if (!query) {
    displayPackages(allPackages);
    return;
  }

  const lowerQuery = query.toLowerCase();
  const filtered = allPackages.filter((pkg) =>
    pkg.name.toLowerCase().includes(lowerQuery)
  );
  displayPackages(filtered);
}

let searchTimeout;
document.getElementById("search").addEventListener("input", (e) => {
  clearTimeout(searchTimeout);
  searchTimeout = setTimeout(() => {
    filterPackages(e.target.value.trim());
  }, 150);
});

document.addEventListener("DOMContentLoaded", loadPackages);
`;
