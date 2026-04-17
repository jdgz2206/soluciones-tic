export function buildCanonical(pathname = "/") {
  const site = import.meta.env.PUBLIC_SITE_URL || "http://localhost:4321";
  const normalized = pathname.startsWith("/") ? pathname : `/${pathname}`;
  return `${site}${normalized}`;
}
