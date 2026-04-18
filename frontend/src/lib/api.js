import { defaultContent } from "../../../shared/content-defaults.js";

function readRuntimeEnv(name) {
  return typeof process !== "undefined" ? process.env?.[name] || "" : "";
}

export function getPublicApiBaseUrl(requestOrigin = "") {
  const configuredBase = readRuntimeEnv("PUBLIC_API_BASE_URL") || import.meta.env.PUBLIC_API_BASE_URL || "";
  return configuredBase || (import.meta.env.DEV ? "http://localhost:4000" : requestOrigin || "");
}

function getBaseUrl(requestOrigin = "") {
  if (import.meta.env.SSR) {
    return (
      readRuntimeEnv("API_SERVER_URL") ||
      readRuntimeEnv("PUBLIC_API_BASE_URL") ||
      import.meta.env.API_SERVER_URL ||
      import.meta.env.PUBLIC_API_BASE_URL ||
      (import.meta.env.DEV ? "http://127.0.0.1:4000" : requestOrigin || "")
    );
  }

  return getPublicApiBaseUrl();
}

async function fetchJson(path, fallback, options = {}) {
  try {
    const baseUrl = getBaseUrl(options.requestOrigin);
    const response = await fetch(baseUrl ? `${baseUrl}${path}` : path);

    if (!response.ok) {
      throw new Error(`Error ${response.status}`);
    }

    return await response.json();
  } catch {
    return structuredClone(fallback);
  }
}

export function getSiteSettings(options) {
  return fetchJson("/api/public/settings", defaultContent.site, options);
}

export function getHomeContent(options) {
  return fetchJson("/api/public/home", defaultContent.home, options);
}

export async function getPageContent(slug, options) {
  const fallback = defaultContent.pages[slug];
  return fetchJson(`/api/public/page/${slug}`, fallback, options);
}

export async function getBlogPosts(options) {
  return fetchJson("/api/public/blog", defaultContent.blog, options);
}

export async function getBlogPost(slug, options) {
  const posts = await getBlogPosts(options);
  return posts.find((entry) => entry.slug === slug) || null;
}

export function getSupportContent(options) {
  return fetchJson("/api/public/support", defaultContent.support, options);
}
