import { requireCmsCapability } from "@/lib/cms/permissions";
import { safeErrorResponse } from "@/lib/errors";
import { getVariables } from "@/lib/cms/variableRegistry";
import { getSchemaRegistry } from "@/lib/cms/schemaRegistry";
import { buildExport, buildCsv } from "@/lib/cms/importExport";

export const dynamic = "force-dynamic";

// GET /api/owner/cms/variables/export?format=json|csv&kind=all|custom|schema
export async function GET(request) {
  try {
    const { error } = await requireCmsCapability(request, "exportVariables");
    if (error) return error;

    const url = new URL(request.url);
    const format = url.searchParams.get("format") === "csv" ? "csv" : "json";
    const kind = url.searchParams.get("kind") || "all";
    const category = url.searchParams.get("category") || "";

    let variables = await getVariables();
    if (kind !== "all") variables = variables.filter((v) => v.kind === kind);
    if (category) variables = variables.filter((v) => v.category === category);

    const stamp = new Date().toISOString().slice(0, 10);
    if (format === "csv") {
      return new Response(buildCsv(variables), {
        headers: {
          "Content-Type": "text/csv; charset=utf-8",
          "Content-Disposition": `attachment; filename="cms-variables-${stamp}.csv"`,
        },
      });
    }

    const payload = buildExport(variables, {
      models: getSchemaRegistry().map((m) => m.name),
    });
    return new Response(JSON.stringify(payload, null, 2), {
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        "Content-Disposition": `attachment; filename="cms-variables-${stamp}.json"`,
      },
    });
  } catch (error) {
    console.error("CMS variable export error:", error);
    return safeErrorResponse(error, 500);
  }
}
