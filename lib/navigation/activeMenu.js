const roots = new Set(['/', '/owner', '/admin', '/dashboard']);

export function normalizeMenuPath(value) {
  if (typeof value !== 'string' || !value.startsWith('/') || value.startsWith('//')) return null;
  return value.split(/[?#]/)[0].replace(/\/+$/, '') || '/';
}

/**
 * Priority-based active menu link matching:
 * 1. Exact match ALWAYS takes precedence across all available menu links.
 *    If "/owner/cms/global" is in the menu, it will match when on "/owner/cms/global",
 *    and "/owner/cms" will NEVER be falsely selected.
 * 2. If no exact match exists, the nearest parent route wins (longest matching prefix).
 *    Dashboard root paths ('/', '/owner', '/admin', '/dashboard') are strictly exact-match only.
 */
export function activeMenuUrl(pathname, items = []) {
  const path = normalizeMenuPath(pathname);
  if (!path) return null;

  const validUrls = [];
  const collect = (links) => {
    for (const item of links || []) {
      const url = normalizeMenuPath(item.url);
      if (url) validUrls.push(url);
      if (item.dropdown?.length) {
        collect(item.dropdown);
      }
    }
  };
  collect(items);

  // Priority 1: Exact match
  if (validUrls.includes(path)) {
    return path;
  }

  // Priority 2: Longest prefix match (excluding root paths)
  let bestPrefix = null;
  for (const url of validUrls) {
    if (roots.has(url)) continue;
    if (path.startsWith(`${url}/`)) {
      if (!bestPrefix || url.length > bestPrefix.length) {
        bestPrefix = url;
      }
    }
  }

  return bestPrefix;
}

export function menuLinkIsActive(url, activeUrl) {
  if (!url || !activeUrl) return false;
  return normalizeMenuPath(url) === normalizeMenuPath(activeUrl);
}

/**
 * Determine if a specific URL is active given the current pathname and a list of all URLs.
 * Used by Topbar and mobile menus to prevent parent/prefix false-positives.
 */
export function isRouteActive(url, pathname, allUrls = []) {
  const target = normalizeMenuPath(url);
  const current = normalizeMenuPath(pathname);
  if (!target || !current) return false;

  // Root is exact only
  if (target === '/' || roots.has(target)) {
    return current === target;
  }

  // If exact match
  if (target === current) return true;

  // If there is an exact match for current among other candidate URLs, this non-matching URL is NOT active
  if (allUrls.length > 0) {
    const normalizedCandidates = allUrls
      .map((u) => normalizeMenuPath(typeof u === 'string' ? u : u?.url))
      .filter(Boolean);
    if (normalizedCandidates.includes(current)) {
      return false;
    }
    // Check if another candidate is a longer prefix match
    const prefixMatches = normalizedCandidates.filter(
      (u) => !roots.has(u) && current.startsWith(`${u}/`)
    );
    if (prefixMatches.length > 0) {
      prefixMatches.sort((a, b) => b.length - a.length);
      return prefixMatches[0] === target;
    }
  }

  return current.startsWith(`${target}/`);
}
