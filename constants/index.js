import webData from "./webdata.json";

export { webData };

export default webData;

export function getSiteUrl() {
  const envUrl = process.env.NEXT_PUBLIC_BASE_URL;
  if (envUrl) return envUrl;
  if (webData.urls.site) return webData.urls.site;
  return "";
}

export function buildPublicUrl(path) {
  const base = getSiteUrl();
  if (!base) return path || "";
  const normalizedBase = base.replace(/\/+$/, "");
  const normalizedPath = path || "";
  if (normalizedPath.startsWith("http")) return normalizedPath;
  return `${normalizedBase}${normalizedPath.startsWith("/") ? normalizedPath : `/${normalizedPath}`}`;
}
