export function resolveMediaUrl(source = "") {
  if (!source) {
    return "";
  }

  if (/^https?:\/\//i.test(source)) {
    return source;
  }

  const base = import.meta.env.PUBLIC_API_BASE_URL || "http://localhost:4000";
  const normalized = source.startsWith("/") ? source : `/${source}`;
  return `${base}${normalized}`;
}
