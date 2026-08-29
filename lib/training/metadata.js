/**
 * Page metadata for the training routes.
 *
 * Builds on `lib/cms/metadata` so these pages get the same title template,
 * favicon stamp and brand fallbacks as every other page — an entity page that
 * invented its own title format would be the one page whose browser tab looks
 * different.
 *
 * Each entity carries its own `seo` object; where a field is blank the page
 * falls back to the entity's real content, and then to the site defaults. A
 * course with no SEO description still gets a useful one from its short
 * description rather than the generic site line.
 *
 * Server-only.
 */
import { pageMetadata } from "@/lib/cms/metadata";
import { getGlobalSettings } from "@/lib/cms";
import { stripHtml, truncate } from "@/lib/training/format";

/**
 * @param fallbackTitle  used when neither the entity nor the CMS names one
 * @param entity         any document with an optional `seo` sub-document
 * @param content        { title, description, image } drawn from the entity
 */
export async function trainingMetadata(fallbackTitle, entity = null, content = {}) {
  const base = await pageMetadata("home", fallbackTitle).catch(() => ({
    title: fallbackTitle,
    description: "",
  }));

  const seo = entity?.seo || {};
  const settings = await getGlobalSettings().catch(() => null);

  const name = String(seo.title || content.title || fallbackTitle || "").trim();
  const template = settings?.seo?.titleTemplate || "%s | Ababeel";
  const title = !name
    ? base.title
    : template.includes("%s")
      ? template.replace("%s", name)
      : `${name} | ${settings?.brand?.shortName || "Ababeel"}`;

  const description =
    truncate(stripHtml(seo.description || content.description || ""), 300) || base.description;

  const image = seo.ogImage || content.image || "";

  return {
    ...base,
    title,
    description,
    // A draft-quality page an owner asked to keep out of search stays out.
    robots: seo.noIndex ? { index: false, follow: false } : undefined,
    openGraph: {
      ...base.openGraph,
      title,
      description,
      images: image ? [{ url: image }] : undefined,
    },
  };
}
