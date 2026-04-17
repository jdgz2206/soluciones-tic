import { defaultContent } from "../../../shared/content-defaults.js";

function getBaseUrl() {
  if (import.meta.env.SSR) {
    return import.meta.env.API_SERVER_URL || import.meta.env.PUBLIC_API_BASE_URL || "http://127.0.0.1:4000";
  }

  return import.meta.env.PUBLIC_API_BASE_URL || "http://localhost:4000";
}

async function fetchJson(path, fallback) {
  try {
    const response = await fetch(`${getBaseUrl()}${path}`);

    if (!response.ok) {
      throw new Error(`Error ${response.status}`);
    }

    return await response.json();
  } catch {
    return structuredClone(fallback);
  }
}

export function getSiteSettings() {
  return fetchJson("/api/public/settings", defaultContent.site);
}

export function getHomeContent() {
  return fetchJson("/api/public/home", defaultContent.home);
}

export async function getPageContent(slug) {
  const fallback = defaultContent.pages[slug];
  return fetchJson(`/api/public/page/${slug}`, fallback);
}

export async function getBlogPosts() {
  return fetchJson("/api/public/blog", defaultContent.blog);
}

export async function getBlogPost(slug) {
  const posts = await getBlogPosts();
  return posts.find((entry) => entry.slug === slug) || null;
}

export function getSupportContent() {
  return fetchJson("/api/public/support", defaultContent.support);
}
