// Curated layouts with a shared, fully editable content contract.
const items = [
  { eyebrow: '01 / Discover', title: 'Find your direction', text: 'Explore qualifications built around the work you want to do.', image: '', href: '/courses', label: 'Explore courses', value: '01' },
  { eyebrow: '02 / Develop', title: 'Learn with purpose', text: 'Build practical understanding with support at every step.', image: '', href: '/schedule', label: 'Find a date', value: '02' },
  { eyebrow: '03 / Progress', title: 'Make your next move', text: 'Turn new knowledge into confident professional practice.', image: '', href: '/registration', label: 'Get started', value: '03' },
];
export const STUDIO_DEFAULTS = {
  layout: 'hero', eyebrow: 'Ababeel / Professional development', title: 'Your next chapter starts here.',
  text: 'Practical learning. Recognised qualifications. A clearer path to the work you want to do.',
  buttonLabel: 'Explore the courses', buttonHref: '/courses', secondaryLabel: 'Talk to our team', secondaryHref: '/contact-us',
  image: '/cms/home/practical.webp', imageAlt: 'Practical professional training', caption: 'A considered approach to professional growth.',
  background: '#f4f1eb', foreground: '#172720', accent: '#d8ed92', cardBackground: '#ffffff',
  font: 'sans', align: 'left', motion: 'reveal', items,
};
export const STUDIO_BLOCK_TYPES = {
  studioSection: {
    label: 'Studio — Editorial section', icon: 'Sparkles', description: 'Editorial layouts, bento cards, scroll stories and animated typography.', defaults: STUDIO_DEFAULTS,
    fields: [
      { key: 'layout', label: 'Layout', type: 'select', options: ['hero','split','bento','features','timeline','scrollStory','marquee','stats','reviews','faq','pricing','contact','logos','team','gallery','cta'] },
      { key: 'eyebrow', label: 'Small label', type: 'text' }, { key: 'title', label: 'Heading', type: 'textarea' },
      { key: 'text', label: 'Description', type: 'textarea' },
      { key: 'buttonLabel', label: 'Primary button', type: 'text' }, { key: 'buttonHref', label: 'Primary link', type: 'text' },
      { key: 'secondaryLabel', label: 'Secondary button', type: 'text' }, { key: 'secondaryHref', label: 'Secondary link', type: 'text' },
      { key: 'image', label: 'Main image', type: 'image' }, { key: 'imageAlt', label: 'Image description', type: 'text' }, { key: 'caption', label: 'Image caption', type: 'text' },
      { group: 'Appearance', key: 'background', label: 'Background', type: 'color' },
      { group: 'Appearance', key: 'foreground', label: 'Text', type: 'color' },
      { group: 'Appearance', key: 'accent', label: 'Accent / buttons', type: 'color' },
      { group: 'Appearance', key: 'cardBackground', label: 'Card background', type: 'color' },
      { group: 'Appearance', key: 'font', label: 'Typography', type: 'select', options: [{ value: 'sans', label: 'Geist — contemporary' }, { value: 'serif', label: 'Georgia — editorial' }, { value: 'mono', label: 'Geist Mono — technical' }] },
      { group: 'Appearance', key: 'align', label: 'Heading alignment', type: 'select', options: ['left','center'] },
      { group: 'Appearance', key: 'motion', label: 'Motion', type: 'select', options: ['none','reveal','float'] },
      { key: 'items', label: 'Cards / steps / questions', type: 'list', defaultItem: items[0], fields: [
        { key: 'eyebrow', label: 'Small label', type: 'text' }, { key: 'title', label: 'Title / question', type: 'text' },
        { key: 'text', label: 'Description / answer', type: 'textarea' }, { key: 'value', label: 'Number / price / short label', type: 'text' },
        { key: 'image', label: 'Image', type: 'image' }, { key: 'href', label: 'Link', type: 'text' }, { key: 'label', label: 'Link label', type: 'text' },
      ] },
    ],
  },
};

const palettes = {
  sage: { background: '#f4f1eb', foreground: '#172720', accent: '#d8ed92', cardBackground: '#ffffff' },
  ink: { background: '#111a26', foreground: '#f7f4ec', accent: '#f4b183', cardBackground: '#1e2a39' },
  paper: { background: '#faf8f3', foreground: '#232b35', accent: '#b8d9f1', cardBackground: '#ffffff' },
};
const layouts = [
  ['hero', 'Statement hero', 'A bold new direction.', 'Heroes'],
  ['split', 'Editorial split', 'Good work starts with the right foundations.', 'Content'],
  ['bento', 'Bento pathways', 'Many ambitions. One place to begin.', 'Features'],
  ['features', 'Feature cards', 'Designed around your progress.', 'Features'],
  ['timeline', 'Numbered journey', 'A clear path from here to what’s next.', 'Content'],
  ['scrollStory', 'Scroll story', 'Progress, one chapter at a time.', 'Scroll Stories'],
  ['marquee', 'Moving statement', 'Learn. Apply. Progress.', 'Scroll Stories'],
  ['stats', 'Number gallery', 'Put your milestones in focus.', 'Stats'],
  ['reviews', 'Editorial reviews', 'In their own words.', 'Testimonials'],
  ['faq', 'Quiet accordion', 'A little clarity goes a long way.', 'FAQ'],
  ['pricing', 'Programme comparison', 'Choose the path that fits.', 'Pricing'],
  ['contact', 'Contact invitation', 'Let’s talk about your next step.', 'Contact'],
  ['logos', 'Partner wall', 'The company we keep.', 'Logos'],
  ['team', 'People portraits', 'Meet the people behind the progress.', 'Team'],
  ['gallery', 'Image journal', 'A closer look at the work.', 'Gallery'],
  ['cta', 'Closing statement', 'The next move is yours.', 'Call To Action'],
];
function contentFor(layout) {
  if (layout === 'faq') return [
    { title: 'How do I choose a qualification?', text: 'Tell our team about your experience and goals. We can help you compare the available programmes.' },
    { title: 'Can I study alongside my work?', text: 'Available delivery modes and dates are listed on each course. Contact us to discuss your schedule.' },
    { title: 'What happens after registration?', text: 'Our training team will contact you to confirm the details and explain the next steps.' },
  ];
  if (layout === 'reviews') return [{ title: 'Your learner’s name', eyebrow: 'Role / organisation', text: 'Add an approved learner testimonial here. Use their own words to tell the story.', image: '' }];
  if (layout === 'stats') return ['Qualifications','Delivery options','Learning pathways'].map((title,i) => ({ title, value: `0${i+1}`, text: 'Replace with your verified milestone.' }));
  if (layout === 'pricing') return ['Foundation','Professional','Executive'].map((title,i) => ({ ...items[i], title, value: 'Enquire', text: 'Add the programme scope, delivery format and current price here.', href: '/contact-us', label: 'Discuss this programme' }));
  if (layout === 'team') return ['Programme lead','Trainer','Learner support'].map(title => ({ title, eyebrow: 'Add a team member', text: 'Add their experience, expertise and role.', image: '' }));
  if (layout === 'logos') return ['Partner one','Partner two','Partner three'].map(title => ({ title, image: '', href: '', text: 'Add your approved partner logo.' }));
  return items;
}
const section = (layout, title, palette, extra = {}) => ({ type: 'studioSection', props: { ...STUDIO_DEFAULTS, ...palettes[palette], layout, title, items: contentFor(layout), ...extra }, style: { animation: 'none', paddingTop: '0', paddingBottom: '0' } });
export const STUDIO_TEMPLATES = layouts.flatMap(([layout, name, title, category]) => ['sage','ink','paper'].map(palette => ({
  id: `studio-${layout}-${palette}`, name: `Studio — ${name}, ${palette}`, category, desc: 'Refined typography, responsive composition and motion that respects reduced-motion preferences.',
  blocks: [section(layout, title, palette, { font: palette === 'paper' ? 'serif' : 'sans' })],
})));
for (const [key, name, pattern] of [
  ['learning','Learning & development',['hero','bento','scrollStory','faq','cta']],
  ['organisation','Organisation & people',['split','stats','team','logos','contact']],
  ['programme','Programme launch',['hero','features','timeline','pricing','faq','cta']],
  ['journal','Editorial journal',['split','gallery','reviews','cta']],
]) STUDIO_TEMPLATES.push({ id: `studio-page-${key}`, name: `Studio — ${name}`, category: 'Full Pages', desc: 'A complete coordinated page. Every section and item can be edited or bound to data.', blocks: pattern.map((layout,i) => section(layout, layouts.find(l => l[0] === layout)[2], i % 3 === 1 ? 'ink' : 'sage')) });

/** Refresh inserted legacy templates with modern typography, smooth animations, and interactive styling. */
export function refreshLegacyTemplate(template) {
  return { ...template, blocks: template.blocks.map((block, index) => {
    const props = { ...block.props };
    if (props.accent) props.accent = '#2563eb';
    if (['hero','cta'].includes(block.type)) {
      props.bgColor = '#091224'; props.textColor = '#f8fafc';
      if (block.type === 'hero') { props.minHeight = '620'; props.align = 'left'; }
    }
    return { ...block, props, style: { ...block.style,
      animation: block.type === 'scrollVideo' ? 'none' : index % 2 ? 'fade-up' : 'fade', animDuration: '0.6',
      css: `${block.style?.css || ''}\nh1,h2,h3 { font-family: var(--font-geist-sans), 'Outfit', 'Inter', sans-serif; letter-spacing: -.035em; text-wrap: balance; font-weight: 700; }\np { line-height: 1.75; text-wrap: pretty; }\na,button { transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1); }\na:hover,button:hover { transform: translateY(-2px); }\n.cms-card { transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1); border-radius: 1rem; }\n.cms-card:hover { transform: translateY(-4px); box-shadow: 0 20px 25px -5px rgba(0,0,0,0.08); }\na:focus-visible,button:focus-visible { outline: 2px solid currentColor; outline-offset: 4px; }\n@media (prefers-reduced-motion: reduce) { * { animation: none !important; transition: none !important; transform: none !important; } }`,
    } };
  }) };
}
