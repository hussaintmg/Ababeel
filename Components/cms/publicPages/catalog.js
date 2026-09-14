import registry from './registry.json';

export const PUBLIC_PAGES = registry.filter(page => page.key !== 'home-faq');
const faq = registry.find(page => page.key === 'home-faq').sections[0];
// The homepage's FAQ is shared with the original standalone component.
const homeFaq = PUBLIC_PAGES.find(page => page.key === 'home').sections[6];
Object.assign(homeFaq, { fields: faq.fields, defaults: faq.defaults, name: 'Frequently asked questions' });
const appearanceFields = [
  { group: 'Section appearance', key: 'sectionBackground', label: 'Section background', type: 'color' },
  { group: 'Section appearance', key: 'sectionText', label: 'Body text colour', type: 'color' },
  { group: 'Section appearance', key: 'sectionHeading', label: 'Heading colour', type: 'color' },
  { group: 'Section appearance', key: 'sectionAccent', label: 'Accent colour', type: 'color' },
  { group: 'Section appearance', key: 'sectionFont', label: 'Typography', type: 'select', options: [{ value: '', label: 'Original' }, { value: 'sans', label: 'Geist' }, { value: 'serif', label: 'Georgia' }, { value: 'mono', label: 'Geist Mono' }] },
  { group: 'Section appearance', key: 'sectionHeadingSize', label: 'Heading size (px, optional)', type: 'text' },
];

export const PUBLIC_BLOCK_TYPES = Object.fromEntries(registry.flatMap(page => page.sections.map(section => [section.type, {
  label: `${page.title} — ${section.name}`,
  icon: 'LayoutTemplate',
  description: `Original ${page.title} layout. Edit content, bind variables, or use Design for scoped styling.`,
  defaults: section.defaults,
  fields: [...section.fields, ...appearanceFields, ...(page.key === 'professional-detail' ? [{ key: 'programId', label: 'Programme (leave empty to use the current page)', type: 'select', options: ['', 'cpd', 'professional-standards', 'flexible-learning', 'networking-opportunities', 'skill-enhancement'] }] : page.key.endsWith('-detail') ? [{ key: 'recordSlug', label: 'Record slug (leave empty to use the current page)', type: 'text' }] : [])],
}])));

const spec = section => ({ type: section.type, props: structuredClone(section.defaults), style: { paddingTop: '0', paddingBottom: '0', animation: 'none' } });
export const PUBLIC_TEMPLATES = PUBLIC_PAGES.flatMap(page => [
  { id: `public-page-${page.key}`, name: `Original — ${page.title}`, category: 'Full Pages', desc: `Complete editable public ${page.title} page, including its working sections.`, blocks: page.sections.map(spec) },
  ...page.sections.map(section => ({ id: section.type, name: `${page.title} — ${section.name}`, category: 'Public Page Sections', desc: `Original public layout with editable content and variable bindings.`, blocks: [spec(section)] })),
]);

export function publicPageBlocks(key) {
  const page = PUBLIC_PAGES.find(page => page.key === key);
  return page?.sections.map(section => ({ id: `original-${section.type}`, type: section.type, props: structuredClone(section.defaults), _style: { paddingTop: '0', paddingBottom: '0', animation: 'none' } })) || [];
}

export function publicBlockPage(type) {
  return PUBLIC_PAGES.find(page => page.live && page.sections.some(section => section.type === type))?.key || null;
}
