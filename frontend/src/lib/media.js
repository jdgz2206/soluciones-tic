function readRuntimeEnv(name) {
  return typeof process !== "undefined" ? process.env?.[name] || "" : "";
}

export function resolveMediaUrl(source = "", requestOrigin = "") {
  if (!source) {
    return "";
  }

  if (/^https?:\/\//i.test(source)) {
    return source;
  }

  const base =
    readRuntimeEnv("PUBLIC_API_BASE_URL") ||
    import.meta.env.PUBLIC_API_BASE_URL ||
    (import.meta.env.DEV ? "http://localhost:4000" : requestOrigin || "");
  const normalized = source.startsWith("/") ? source : `/${source}`;
  return base ? `${base}${normalized}` : normalized;
}
