/** Traverse every supported authoring and expanded-repeater block container. */
export async function mapBlockTree(blocks, transform) {
 return Promise.all((Array.isArray(blocks)?blocks:[]).map(async block=>{
  let next=await transform(block);
  if(Array.isArray(next.children)) next={...next,children:await mapBlockTree(next.children,transform)};
  if(Array.isArray(next.props?.children)) next={...next,props:{...next.props,children:await mapBlockTree(next.props.children,transform)}};
  if(Array.isArray(next.props?._items)) next={...next,props:{...next.props,_items:await Promise.all(next.props._items.map(async item=>Array.isArray(item?.blocks)?{...item,blocks:await mapBlockTree(item.blocks,transform)}:item))}};
  return next;
 }));
}
export function flattenBlockTree(blocks) {
 const out=[];
 const visit=list=>{ for(const block of list||[]) {out.push(block);visit(block.children);visit(block.props?.children);for(const item of block.props?._items||[]) if(Array.isArray(item?.blocks)) visit(item.blocks);}};
 visit(blocks);return out;
}
