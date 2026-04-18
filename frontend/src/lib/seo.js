function readRuntimeEnv(name) {
  return typeof process !== "undefined" ? process.env?.[name] || "" : "";
}

export function buildCanonical(pathname = "/", requestOrigin = "") {
  const site =
    readRuntimeEnv("PUBLIC_SITE_URL") ||
    import.meta.env.PUBLIC_SITE_URL ||
    (import.meta.env.DEV ? "http://localhost:4321" : requestOrigin || "");
  const normalized = pathname.startsWith("/") ? pathname : `/${pathname}`;
  return site ? `${site}${normalized}` : normalized;
}
