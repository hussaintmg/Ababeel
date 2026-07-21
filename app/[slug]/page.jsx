// Dynamic route for owner-created custom pages. Any single-segment path that
// isn't a real app route lands here (static routes always win). If a published
// custom CMS page exists for the slug we render its blocks; otherwise 404.
import { notFound } from "next/navigation";
import { getCmsDoc, getGlobalSettings } from "@/lib/cms";
import BlockRenderer from "@/Components/cms/BlockRenderer";

export const dynamic = "force-dynamic";

async function loadCustomPage(slug) {
  const doc = await getCmsDoc(slug);
  if (!doc || !doc.isCustom || !doc.enabled) return null;
  return doc;
}

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const doc = await loadCustomPage(slug);
  if (!doc) return {};
  let title = doc.title || slug;
  try {
    const seo = await getGlobalSettings();
    const tpl = seo?.seo?.titleTemplate;
    if (tpl) title = tpl.replace("%s", doc.title || slug);
  } catch {
    /* fall back to plain title */
  }
  return { title };
}

export default async function CustomPage({ params }) {
  const { slug } = await params;
  const doc = await loadCustomPage(slug);
  if (!doc) notFound();

  return (
    <div className="cms-fade-in">
      {doc.customCss ? <style dangerouslySetInnerHTML={{ __html: doc.customCss }} /> : null}
      <BlockRenderer blocks={doc.blocks} />
    </div>
  );
}
