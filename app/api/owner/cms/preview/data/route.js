import { requireCmsCapability } from "@/lib/cms/permissions";
import { safeErrorResponse, successResponse, badRequestResponse } from "@/lib/errors";
import { checkRateLimit, rateLimitResponse } from "@/lib/rateLimit";
import { resolvePageContext } from "@/lib/cms/pageData";
import { getGlobalSettings } from "@/lib/cms";
import { schemaTree } from "@/lib/cms/variableRegistry";
import { buildSampleContext } from "@/lib/cms/sampleData";
import { injectPublicSectionData } from "@/lib/cms/publicSectionData";
import { resolvePublicBlocks } from "@/lib/cms/publicData";
import { flattenBlockTree } from "@/lib/cms/blockTree";
import { getFeatures } from "@/lib/cms/features";

export const dynamic = "force-dynamic";

// POST { dataSources, dynamicRoute, params, mode }
// Resolves the full data context a page would see, for the builder preview.
//   mode "live"   → real database records
//   mode "sample" → schema-generated placeholder records
//   mode "mixed"  → live where available, sample for anything empty
export async function POST(request) {
  try {
    const { user, error } = await requireCmsCapability(request, "useLiveData");
    if (error) return error;

    const rl = await checkRateLimit(request, "cmsPreviewData", {
      userId: user._id.toString(),
      windowMs: 60 * 1000,
      maxAttempts: 120,
    });
    if (!rl.allowed) return rateLimitResponse(rl.retryAfter);

    let body;
    try {
      body = await request.json();
    } catch {
      return badRequestResponse("Invalid JSON body");
    }

    const mode = body?.mode === "sample" ? "sample" : "live";

    if (mode === "sample") {
      return successResponse({
        data: { mode, context: buildSampleContext(schemaTree()), meta: {} },
      });
    }

    const settings = await getGlobalSettings();
    const features=getFeatures(settings);
    const doc={blocks:Array.isArray(body.blocks)?body.blocks.slice(0,200):[],dataSources:features.dynamicCms && features.liveData ? body?.dataSources : [],dynamicRoute:features.dynamicCms && features.liveData ? body?.dynamicRoute : null};
    const {context,meta}=await resolvePageContext(doc,{params:body?.params||{},user,globalSettings:settings});
    const diagnostics=Object.entries(meta).filter(([,value])=>value.error).map(([source,value])=>({source,code:'query_failed',message:value.error}));
    let filled=[];
    try { filled=(await resolvePublicBlocks(doc,{params:body.params||{},resolved:{context,meta,features},strict:true})).blocks; }
    catch(error) {diagnostics.push({code:'catalogue_failed',message:error.message||'Catalogue query failed'});}
    const catalogue=Object.fromEntries(flattenBlockTree(filled).filter(block=>block.props?._data||block.props?._items).map(block=>[block.id,{_data:block.props._data,_items:block.props._items}]));
    return successResponse({data:{mode,context,meta,catalogue,diagnostics,blocks:filled}});
  } catch (error) {
    console.error("CMS preview data error:", error);
    return safeErrorResponse(error, 500);
  }
}
