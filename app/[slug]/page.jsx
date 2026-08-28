// Dynamic route for owner-created custom pages. Any single-segment path that
// isn't a real app route lands here (static routes always win). If a published
// custom CMS page exists for the slug we render its blocks; otherwise 404.
//
// Pages that bind to database variables have their data context resolved here,
// on the server, so the HTML the visitor (and search engines) receive already
// contains the real records.
import { notFound } from "next/navigation";
import { getCmsDoc, getGlobalSettings } from "@/lib/cms";
import BlockRenderer from "@/Components/cms/BlockRenderer";
import { resolvePublicPageData, resolvePublicBlocks, optionalServerUser } from "@/lib/cms/publicData";
import { resolveTemplate } from "@/lib/cms/expression";

export const dynamic = "force-dynamic";

async function loadCustomPage(slug) {
  const doc = await getCmsDoc(slug);
  if (!doc || !doc.isCustom || !doc.enabled) return null;
  return doc;
}

// Query-string values are exposed to the page as `params.*`.
async function searchParamsFrom(searchParams) {
  const raw = (await searchParams) || {};
  const out = {};
  for (const [k, v] of Object.entries(raw)) out[k] = Array.isArray(v) ? v[0] : v;
  return out;
}

export async function generateMetadata({ params, searchParams }) {
  const { slug } = await params;
  const doc = await loadCustomPage(slug);
  if (!doc) return {};
  let title = doc.title || slug;
  try {
    const settings = await getGlobalSettings();
    // The title may itself reference data, e.g. "{{course.title}}".
    const resolved = await resolvePublicPageData(doc, { params: await searchParamsFrom(searchParams) });
    if (resolved?.context) title = String(resolveTemplate(title, resolved.context) || title);
    const tpl = settings?.seo?.titleTemplate;
    if (tpl) title = tpl.replace("%s", title);
  } catch {
    /* fall back to plain title */
  }
  return { title };
}

export default async function CustomPage({ params, searchParams }) {
  const { slug } = await params;
  const doc = await loadCustomPage(slug);
  if (!doc) notFound();

  // Resolved server-side, so the browser only ever receives the blocks this
  // visitor is meant to see.
  const { blocks } = await resolvePublicBlocks(doc, {
    params: await searchParamsFrom(searchParams),
    user: await optionalServerUser(),
  });

  return (
    <div className="cms-fade-in">
      {doc.customCss ? <style dangerouslySetInnerHTML={{ __html: doc.customCss }} /> : null}
      <BlockRenderer blocks={blocks} />
    </div>
  );
}
