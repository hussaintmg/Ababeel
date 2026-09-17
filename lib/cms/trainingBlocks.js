import { mapBlockTree } from "./blockTree";
/**
 * Live catalogue data for the page-builder's training blocks.
 *
 * The existing dynamic CMS can already bind a block to a saved query, but that
 * asks an owner to configure a data source, pick a model, add filters and get
 * the publication rules right before a "Featured courses" section shows a
 * single course. These blocks skip all of that: they declare what they need in
 * their props, and this module resolves it on the server before the blocks
 * reach the browser.
 *
 * That also means the publication rules are applied in one place —
 * `lib/training/queries.js` — rather than depending on an author remembering to
 * filter for `status: published`.
 *
 * Requests are deduplicated across a page: three course sections asking for
 * featured courses is one query, not three.
 *
 * Server-only.
 */
import {
  getFeaturedCourses,
  listPublicCourses,
  getUpcomingSessions,
  listAwardingBodies,
  listAccreditations,
  listConsultants,
  listTeamMembers,
  listTestimonials,
} from "@/lib/training/queries";

/** Block types this module fills in, and the dataset each one needs. */
export const TRAINING_BLOCK_TYPES = [
  "courseGrid",
  "scheduleList",
  "awardingBodyLogos",
  "accreditationLogos",
  "consultantList",
  "teamGrid",
  "reviewWall",
];

const isTrainingBlock = (type) => TRAINING_BLOCK_TYPES.includes(type);

/**
 * What a block needs, as a cache key plus the loader that satisfies it.
 *
 * The key has to capture every prop that changes the result, or two blocks with
 * different filters would share one answer.
 */
function requestFor(block) {
  const p = block?.props || {};
  const limit = clamp(p.limit, 1, 24, 6);

  switch (block.type) {
    case "courseGrid": {
      const source = p.source || "featured";
      if (source === "featured") {
        return { key: `courses:featured:${limit}`, load: () => getFeaturedCourses(limit) };
      }
      const level = p.level || "";
      const awardingBody = p.awardingBody || "";
      const category = p.category || "";
      return {
        key: `courses:list:${level}:${awardingBody}:${category}:${limit}`,
        load: async () => {
          const result = await listPublicCourses({
            level,
            awardingBody,
            category,
            limit,
            sort: p.sort || "recommended",
          });
          return result.items;
        },
      };
    }

    case "scheduleList": {
      const mode = p.mode || "";
      const months = clamp(p.months, 1, 12, 3);
      return {
        key: `schedule:${mode}:${months}:${limit}`,
        load: () => getUpcomingSessions({ mode, months, limit }),
      };
    }

    case "awardingBodyLogos":
      return { key: "awardingBodies", load: () => listAwardingBodies() };

    case "accreditationLogos": {
      const trustStripOnly = p.trustStripOnly !== false;
      return {
        key: `accreditations:${trustStripOnly}`,
        load: () => listAccreditations({ trustStripOnly }),
      };
    }

    case "consultantList":
      return { key: `consultants:${limit}`, load: () => listConsultants(limit) };

    case "teamGrid":
      return { key: `team:${limit}`, load: () => listTeamMembers(limit) };

    case "reviewWall":
      return { key: `testimonials:${limit}`, load: () => listTestimonials(limit) };

    default:
      return null;
  }
}

/**
 * Fill in every training block on a page.
 *
 * Returns a new array; blocks that need nothing are passed through unchanged
 * (by reference, so a page of ordinary blocks costs nothing here).
 *
 * A failed load leaves `_items: []`, and the renderers treat that as "nothing
 * to show" — a section that cannot reach the database renders its empty state
 * rather than taking the page down.
 */
export async function injectTrainingData(blocks, {strict=false}={}) {
 const requests=new Map();
 return mapBlockTree(blocks, async block=>{
  const request=requestFor(block);
  if(!request) return block;
  if(!requests.has(request.key)) requests.set(request.key,Promise.resolve().then(request.load));
  try {return {...block,props:{...block.props,_items:(await requests.get(request.key))||[]}};}
  catch(error) {if(strict) throw error; return {...block,props:{...block.props,_items:[],_dataError:'Catalogue query failed'}};}
 });
}

function clamp(value, min, max, fallback) {
  const n = Number(value);
  if (!Number.isFinite(n)) return fallback;
  return Math.min(Math.max(Math.trunc(n), min), max);
}
