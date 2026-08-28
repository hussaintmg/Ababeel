/**
 * Fuzzy variable search — client-safe.
 *
 * Ranks an exact name match above a prefix match, above a substring match,
 * above a subsequence ("fnm" → firstName) match, so typing "email" surfaces
 * `user.email` before `candidate.emailVerifiedAt`.
 */

function subsequenceScore(query, target) {
  let qi = 0;
  let score = 0;
  let streak = 0;
  for (let ti = 0; ti < target.length && qi < query.length; ti++) {
    if (target[ti] === query[qi]) {
      streak += 1;
      score += 1 + streak;
      qi += 1;
    } else {
      streak = 0;
    }
  }
  return qi === query.length ? score : -1;
}

/** Score one variable against a query. Returns -1 when it does not match. */
export function scoreVariable(variable, query) {
  const q = String(query || "").trim().toLowerCase();
  if (!q) return 0;
  const name = String(variable.name || "").toLowerCase();
  const label = String(variable.label || "").toLowerCase();
  const source = String(variable.source || "").toLowerCase();
  const leaf = name.split(".").pop();

  if (name === q) return 1000;
  if (leaf === q) return 900;
  if (name.startsWith(q)) return 800 - name.length;
  if (leaf.startsWith(q)) return 700 - name.length;
  if (name.includes(q)) return 600 - name.indexOf(q);
  if (label.includes(q)) return 500;
  if (source.includes(q)) return 400;

  const sub = subsequenceScore(q, name);
  return sub > 0 ? 100 + sub : -1;
}

/** Filter + rank a variable list. */
export function searchVariables(variables, query, { limit = 100 } = {}) {
  const list = Array.isArray(variables) ? variables : [];
  if (!String(query || "").trim()) return list.slice(0, limit);
  return list
    .map((v) => ({ v, score: scoreVariable(v, query) }))
    .filter((x) => x.score >= 0)
    .sort((a, b) => b.score - a.score || a.v.name.localeCompare(b.v.name))
    .slice(0, limit)
    .map((x) => x.v);
}

/**
 * Autocomplete for a partially typed path: "user." lists every direct child of
 * `user`, "course.ins" narrows to matching children.
 */
export function autocompletePaths(variables, partial, { limit = 20 } = {}) {
  const raw = String(partial || "");
  const lastDot = raw.lastIndexOf(".");
  const prefix = lastDot === -1 ? "" : raw.slice(0, lastDot);
  const fragment = (lastDot === -1 ? raw : raw.slice(lastDot + 1)).toLowerCase();

  return (variables || [])
    .filter((v) => {
      const name = v.name;
      if (prefix) {
        if (!name.startsWith(`${prefix}.`)) return false;
        const rest = name.slice(prefix.length + 1);
        if (rest.includes(".")) return false;
        return rest.toLowerCase().startsWith(fragment);
      }
      if (name.includes(".")) return false;
      return name.toLowerCase().startsWith(fragment);
    })
    .slice(0, limit);
}
