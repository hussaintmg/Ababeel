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

function humanizeFieldLabel(f, index, fields) {
  const key = f.key || "";
  const rawLabel = f.label || "";

  // Link / URL field
  if (key.startsWith("href_") || rawLabel.startsWith("Href ")) {
    const nextField = fields[index + 1];
    const buttonName = nextField?.label?.replace(/^Text\s+/, "")?.trim();
    return buttonName ? `Link URL (${buttonName})` : `Button Link (URL)`;
  }

  // Button text right after a link
  const prevField = fields[index - 1];
  if (prevField && (prevField.key?.startsWith("href_") || prevField.label?.startsWith("Href "))) {
    const clean = rawLabel.replace(/^Text\s+/, "").trim();
    return clean ? `Button Label (${clean})` : `Button Label`;
  }

  // Heading fields
  if (key.startsWith("Heading_") || rawLabel.startsWith("Heading ")) {
    const headingIndex = fields.slice(0, index + 1).filter(item => item.key?.startsWith("Heading_") || item.label?.startsWith("Heading ")).length;
    const cleanHeading = rawLabel.replace(/^Heading\s+/, "").trim();
    if (headingIndex === 1) return `Main Heading (${cleanHeading.slice(0, 32)})`;
    if (headingIndex === 2) return `Subheading / Accent (${cleanHeading.slice(0, 32)})`;
    return `Card / Feature Title ${headingIndex - 2} (${cleanHeading.slice(0, 24)})`;
  }

  // Eyebrow / badge text (text field immediately preceding the first heading)
  const nextIsHeading = fields[index + 1] && (fields[index + 1].key?.startsWith("Heading_") || fields[index + 1].label?.startsWith("Heading "));
  if (nextIsHeading && (key.startsWith("Text_") || rawLabel.startsWith("Text "))) {
    return "Badge / Eyebrow Text";
  }

  // Accent / highlight line (text field immediately after first heading)
  if (prevField && (prevField.key?.startsWith("Heading_") || prevField.label?.startsWith("Heading ")) && (key.startsWith("Text_") || rawLabel.startsWith("Text "))) {
    return "Heading Accent Line";
  }

  // Description / subtitle fields
  if (key.startsWith("Description_") || rawLabel.startsWith("Description ")) {
    const cleanDesc = rawLabel.replace(/^Description\s+/, "").trim();
    // Short metric value (e.g. 50k+, 99.4%, 100%, 25+)
    if (/^(\d+[\d.,]*%?|\d+\+?|\d+\.\d+%?)$/.test(cleanDesc) || cleanDesc.length <= 8) {
      return `Metric Value (${cleanDesc})`;
    }
    const prevDesc = prevField && (prevField.key?.startsWith("Description_") || prevField.label?.startsWith("Description "));
    if (prevDesc && /^(\d+[\d.,]*%?|\d+\+?)$/.test(prevField.label?.replace(/^Description\s+/, "").trim())) {
      return `Metric Label (${cleanDesc.slice(0, 30)})`;
    }
    const descIndex = fields.slice(0, index + 1).filter(item => item.key?.startsWith("Description_") || item.label?.startsWith("Description ")).length;
    if (descIndex === 1) return `Section Description / Subtitle`;
    return `Paragraph / Detail Text ${descIndex} (${cleanDesc.slice(0, 30)})`;
  }

  // Other text fields
  if (key.startsWith("Text_") || rawLabel.startsWith("Text ")) {
    const cleanText = rawLabel.replace(/^Text\s+/, "").trim();
    return cleanText ? `Label / Text (${cleanText.slice(0, 35)})` : "Text Content";
  }

  return rawLabel || key;
}

function humanizeSectionFields(fields) {
  return (fields || []).map((f, i, all) => ({
    ...f,
    label: humanizeFieldLabel(f, i, all),
  }));
}

export const PUBLIC_BLOCK_TYPES = Object.fromEntries(registry.flatMap(page => page.sections.map(section => [section.type, {
  label: `${page.title} — ${section.name}`,
  icon: 'LayoutTemplate',
  description: `Original ${page.title} layout. Edit content, bind variables, or use Design for scoped styling.`,
  defaults: section.defaults,
  fields: [...humanizeSectionFields(section.fields), ...appearanceFields, ...(page.key === 'professional-detail' ? [{ key: 'programId', label: 'Programme (leave empty to use the current page)', type: 'select', options: ['', 'cpd', 'professional-standards', 'flexible-learning', 'networking-opportunities', 'skill-enhancement'] }] : page.key.endsWith('-detail') ? [{ key: 'recordSlug', label: 'Record slug (leave empty to use the current page)', type: 'text' }] : [])],
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
