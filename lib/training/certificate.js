/**
 * Certificate resolution.
 *
 * A course's own certificate image is optional; when it is missing the page
 * shows the default configured in the CMS. Both may legitimately be empty — a
 * brand-new site has neither — so callers get `null` and render nothing rather
 * than a broken image frame.
 */

/**
 * @param course  a TrainingCourse (lean object or document)
 * @param training  the resolved `settings.training` bag
 * @returns {{ src: string, isDefault: boolean, note: string } | null}
 */
export function resolveCertificate(course, training) {
  const own = String(course?.certificateImage || "").trim();
  const fallback = String(training?.defaultCertificateImage || "").trim();
  const note = String(training?.certificateNote || "").trim();

  if (own) return { src: own, isDefault: false, note };
  if (fallback) return { src: fallback, isDefault: true, note };
  return null;
}
