import { getCmsDoc } from "@/lib/cms";
import { resolvePublicBlocks } from "@/lib/cms/publicData";
import BlockRenderer from "@/Components/cms/BlockRenderer";

/**
 * A CMS-overridable region of a server-rendered page.
 *
 * The training pages are real React pages — a course browser, a schedule, a
 * registration form — and could not be CMS block pages without losing the tool
 * that is their point. This is the bridge: the page renders its built-in
 * content as `children`, and when the owner enables the page's CMS document
 * and gives it blocks, those blocks render here instead.
 *
 * On the browser pages the slot wraps only the hero, so the owner controls the
 * page's voice while the tool below stays; on the content pages it wraps
 * everything. Either way the built-in remains the fallback — a disabled or
 * empty CMS document changes nothing, which is the same safety the rest of the
 * managed pages already have.
 *
 * Server component: blocks are resolved here (live catalogue data included),
 * so the browser only ever receives what it should see.
 */
export default async function CmsSlot({ pageKey, children }) {
  let doc = null;
  try {
    doc = await getCmsDoc(pageKey);
  } catch {
    // The database being briefly unreachable must cost the owner's override,
    // not the page.
    return children;
  }

  if (!doc?.enabled || !Array.isArray(doc.blocks) || !doc.blocks.length) return children;

  let blocks = doc.blocks;
  try {
    ({ blocks } = await resolvePublicBlocks(doc, {}));
  } catch {
    // Unresolved blocks still render; live sections show their empty states.
  }

  return (
    <div className="cms-fade-in">
      {doc.customCss ? <style dangerouslySetInnerHTML={{ __html: doc.customCss }} /> : null}
      <BlockRenderer blocks={blocks} />
    </div>
  );
}
