/**
 * Join class names, dropping anything falsy.
 *
 * Deliberately not `tailwind-merge`: nothing here relies on a later class
 * beating an earlier one, and adding a dependency to concatenate strings is a
 * poor trade. Where a caller must override a default, the components below take
 * an explicit prop rather than hoping class order resolves it.
 */
export function cn(...parts) {
  return parts.filter(Boolean).join(" ");
}

export default cn;
