import { newId, defaultStyle } from '@/Components/cms/blockSchemas';
const clone = value => JSON.parse(JSON.stringify(value));
export function cloneTemplateBlocks(blocks = []) {
 return blocks.map(spec => {
  const block=clone(spec);
  block.id=newId(); block.props=block.props || {}; block._style={...defaultStyle(),...(block.style || {}),...(block._style || {})};
  delete block.style;
  if(Array.isArray(block.children)) block.children=cloneTemplateBlocks(block.children);
  return block;
 });
}
const canonical=value=>JSON.stringify(value,(_,v)=>v && typeof v==='object' && !Array.isArray(v) ? Object.fromEntries(Object.entries(v).sort(([a],[b])=>a.localeCompare(b))) : v);
function remap(value, aliases, field='') {
 if(Array.isArray(value)) return value.map(v=>remap(v,aliases,field));
 if(value && typeof value==='object') return Object.fromEntries(Object.entries(value).map(([k,v])=>[k,remap(v,aliases,k)]));
 if(typeof value!=='string' || field==='_code' || field==='_css') return value;
 const path=v=>{ const [root,...rest]=v.split('.'); return aliases[root] ? [aliases[root],...rest].join('.') : v; };
 if(['source','path','field','fieldPath','dependsOn'].includes(field)) return path(value);
 return value.replace(/\{\{\s*([\w$]+)([^}]*?)\}\}/g,(all,root,rest)=>aliases[root] ? `{{${aliases[root]}${rest}}}` : all);
}
export function insertTemplateSources(template, sources = []) {
 const dataSources=clone(sources), aliases={};
 for(const source of template.dataSources || []) {
  const {key,...definition}=source;
  const normalized=remap(definition,aliases);
  const existing=dataSources.find(({key:other,...rest})=>canonical(rest)===canonical(normalized));
  if(existing){aliases[key]=existing.key;continue;}
  let next=key, i=2; while(dataSources.some(s=>s.key===next)) next=`${key}_${i++}`;
  aliases[key]=next; dataSources.push({...normalized,key:next});
 }
 return {blocks:cloneTemplateBlocks(remap(template.blocks || [],aliases)),dataSources,aliases};
}
export function updateSdkInstance(blocks, id, saved) {
 return blocks.map(block=>{
  if(block.id===id) return {...block,props:{...(saved.defaultProps || {}),...(block.props || {}),_name:saved.name,_code:saved.code,_css:saved.css,_fields:saved.fields || [],_options:saved.options || {}}};
  return Array.isArray(block.children) ? {...block,children:updateSdkInstance(block.children,id,saved)} : block;
 });
}
