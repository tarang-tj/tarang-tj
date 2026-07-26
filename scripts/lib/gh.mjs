// Minimal GitHub REST helper. Uses GITHUB_TOKEN when present (Actions), works
// unauthenticated for local runs at a lower rate limit.
const API = "https://api.github.com";

export async function gh(path) {
  const headers = {
    accept: "application/vnd.github+json",
    "user-agent": "tarang-tj-profile-build",
  };
  if (process.env.GITHUB_TOKEN) {
    headers.authorization = `Bearer ${process.env.GITHUB_TOKEN}`;
  }
  const res = await fetch(`${API}${path}`, { headers });
  if (!res.ok) {
    throw new Error(`GitHub ${res.status} on ${path}: ${await res.text()}`);
  }
  return res.json();
}

// Follows RFC 5988 pagination until exhausted or `cap` pages are read.
export async function ghPaged(path, cap = 5) {
  const out = [];
  for (let page = 1; page <= cap; page++) {
    const sep = path.includes("?") ? "&" : "?";
    const batch = await gh(`${path}${sep}per_page=100&page=${page}`);
    out.push(...batch);
    if (batch.length < 100) break;
  }
  return out;
}
