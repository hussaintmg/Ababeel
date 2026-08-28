// Dynamic CMS page templates.
//
//   /courses/react-masterclass
//        ↓  SiteContent { key: "courses", dynamicRoute: { model, lookupField } }
//        ↓  Course.findOne({ slug: "react-masterclass" })
//        ↓  data context { course: {...} }
//        ↓  the page's blocks, rendered once for that record
//
// One template therefore renders every record in a collection. Static app
// routes always win, so this only ever catches two-segment paths that no real
// route claims.
import { notFound } from "next/navigation";
import { getCmsDoc, getGlobalSettings } from "@/lib/cms";
import BlockRenderer from "@/Components/cms/BlockRenderer";
import { resolvePublicPageData, resolvePublicBlocks, optionalServerUser } from "@/lib/cms/publicData";
import { resolveTemplate } from "@/lib/cms/expression";
import { expandBlocks } from "@/lib/cms/binding";

export const dynamic = "force-dynamic";

async function loadTemplate(slug) {
  const doc = await getCmsDoc(slug);
  if (!doc || !doc.isCustom || !doc.enabled) return null;
  if (!doc.dynamicRoute?.enabled) return null;
  return doc;
}

async function contextFor(doc, param, searchParams) {
  const raw = (await searchParams) || {};
  const params = {};
  for (const [k, v] of Object.entries(raw)) params[k] = Array.isArray(v) ? v[0] : v;
  params[doc.dynamicRoute.paramName || "slug"] = param;
  return resolvePublicPageData(doc, { params, user: await optionalServerUser() });
}

export async function generateMetadata({ params, searchParams }) {
  const { slug, param } = await params;
  const doc = await loadTemplate(slug);
  if (!doc) return {};
  try {
    const resolved = await contextFor(doc, param, searchParams);
    const itemKey = doc.dynamicRoute.itemKey || "item";
    const item = resolved?.context?.[itemKey];
    if (!item) return {};
    let title = String(resolveTemplate(doc.title || slug, resolved.context) || doc.title || slug);
    const settings = await getGlobalSettings();
    const tpl = settings?.seo?.titleTemplate;
    if (tpl) title = tpl.replace("%s", title);
    return { title };
  } catch {
    return {};
  }
}

export default async function DynamicTemplatePage({ params, searchParams }) {
  const { slug, param } = await params;
  const doc = await loadTemplate(slug);
  if (!doc) notFound();

  const resolved = await contextFor(doc, param, searchParams);
  const itemKey = doc.dynamicRoute.itemKey || "item";
  // No matching record → a real 404 rather than a page of empty variables.
  if (!resolved?.context?.[itemKey]) notFound();

  const blocks = expandBlocks(doc.blocks, resolved.context);

  return (
    <div className="cms-fade-in">
      {doc.customCss ? <style dangerouslySetInnerHTML={{ __html: doc.customCss }} /> : null}
      <BlockRenderer blocks={blocks} />
    </div>
  );
}
