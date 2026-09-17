export const SOURCE_OPERATIONS = ['findMany','findOne','findById','findBySlug','currentUser','routeParam','count','upcomingSessions'];
const RESERVED = new Set(['site','user','params','route','now','item','__proto__','constructor','prototype']);
const OP_ALIAS_MAP = {
  '==': 'equals',
  '=': 'equals',
  'eq': 'equals',
  '!=': 'notEquals',
  'neq': 'notEquals',
  '>': 'gt',
  '>=': 'gte',
  '<': 'lt',
  '<=': 'lte',
};

export function normalizeSource(src = {}, { allowReserved = false } = {}) {
  const key=String(src.key||'').trim();
  if (!/^[a-zA-Z_$][a-zA-Z0-9_$]*$/.test(key) || (!allowReserved && RESERVED.has(key))) throw new Error(`Invalid or reserved source alias: ${key}`);
  const operation=src.operation || (src.mode==='single'?'findOne':src.mode==='count'?'count':'findMany');
  if (!SOURCE_OPERATIONS.includes(operation)) throw new Error(`Unsupported source operation: ${operation}`);
  if(operation==='upcomingSessions' && src.model!=='CourseReference') throw new Error('upcomingSessions requires CourseReference');
  const out={
    key,
    model:String(src.model||''),
    label:String(src.label||key).slice(0,120),
    operation,
    mode:operation==='count'?'count':['findOne','findById','findBySlug','routeParam','currentUser'].includes(operation)?'single':'list',
    match:src.match==='any'?'any':'all',
    filters:(Array.isArray(src.filters)?src.filters:[]).slice(0,20).map(f=>{
      const rawOp=String(f?.op||'equals');
      const op=OP_ALIAS_MAP[rawOp]||rawOp;
      return {field:String(f?.field||''),op,value:Array.isArray(f?.value)?f.value.filter(v=>typeof v!=='object'):typeof f?.value==='object'?'':f?.value??'',dynamic:!!f?.dynamic};
    }),
    sortField:String(src.sortField||'createdAt'),
    sortDir:src.sortDir==='asc'?'asc':'desc',
    limit:Math.min(200,Math.max(1,parseInt(src.limit,10)||(operation==='upcomingSessions'?6:12))),
    skip:Math.max(0,parseInt(src.skip,10)||0),
    paginate:!!src.paginate,
    populate:(Array.isArray(src.populate)?src.populate:[]).slice(0,10).map(String),
    months:Math.min(12,Math.max(1,parseInt(src.months,10)||3))
  };
  for(const field of ['documentId','id','slug','paramName','lookupField','courseId','course']) if(src[field]!==undefined) out[field]=String(src[field]).slice(0,500);
  return out;
}
export function normalizeSources(sources=[]) {
 const seen=new Set();
 return sources.map(source=>{const normalized=normalizeSource(source); if(seen.has(normalized.key)) throw new Error(`Duplicate source alias: ${normalized.key}`); seen.add(normalized.key); return normalized;});
}
