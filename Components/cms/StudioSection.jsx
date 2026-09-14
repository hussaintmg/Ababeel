"use client";

import { useRef } from 'react';
import Link from 'next/link';
import { motion, useReducedMotion, useScroll, useTransform } from 'framer-motion';
import { ArrowUpRight, ArrowDown, Plus, Sparkles } from 'lucide-react';
import { STUDIO_DEFAULTS } from './studioCatalog';
import './studio.css';

const fonts = { sans: 'var(--font-geist-sans), sans-serif', serif: 'Georgia, Cambria, serif', mono: 'var(--font-geist-mono), monospace' };
const safeHref = value => typeof value === 'string' && /^(\/[^/]|\/$|https?:\/\/|mailto:|tel:|#)/i.test(value) ? value : '#';
function Actions({ p }) {
  return <div className="studio-actions">
    {p.buttonLabel && <Link href={safeHref(p.buttonHref)} className="studio-button">{p.buttonLabel}<ArrowUpRight size={19} aria-hidden="true" /></Link>}
    {p.secondaryLabel && <Link href={safeHref(p.secondaryHref)} className="studio-text-link">{p.secondaryLabel}<span aria-hidden="true">↗</span></Link>}
  </div>;
}
function Visual({ image, alt = '', index = 0, caption }) {
  return <figure className={`studio-visual studio-visual-${index % 3}`}>
    {image ? <img src={image} alt={alt} loading="lazy" /> : <div className="studio-art" aria-hidden="true"><div /><div /><span>{String(index + 1).padStart(2,'0')}</span></div>}
    {caption && <figcaption>{caption}</figcaption>}
  </figure>;
}
function Reveal({ children, enabled, index = 0, className = '' }) {
  return <motion.div className={className} initial={false} whileInView={enabled ? { opacity: [0.35, 1], y: [24, 0] } : undefined} viewport={{ once: true, amount: 0.12 }} transition={{ duration: 0.65, delay: Math.min(index * 0.07, 0.3), ease: [0.22,1,0.36,1] }}>{children}</motion.div>;
}
function ScrollStory({ p, items, enabled }) {
  const ref = useRef(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start center','end center'] });
  const scaleY = useTransform(scrollYProgress, [0,1], [0,1]);
  return <div ref={ref} className={`studio-story ${enabled ? '' : 'studio-story-static'}`}>
    <div className="studio-story-intro"><span className="studio-eyebrow">{p.eyebrow}</span><h2>{p.title}</h2><p className="studio-lead">{p.text}</p><Actions p={p}/><div className="studio-progress" aria-hidden="true"><motion.div style={enabled ? { scaleY } : { scaleY: 1 }} /></div></div>
    <div className="studio-story-chapters">{items.map((item,i) => <Reveal key={i} enabled={enabled} className="studio-chapter"><span className="studio-eyebrow">{item.eyebrow || `Chapter ${String(i+1).padStart(2,'0')}`}</span><Visual image={item.image} alt={item.title} index={i}/><h3>{item.title}</h3><p>{item.text}</p>{item.label && <Link href={safeHref(item.href)} className="studio-text-link">{item.label}<ArrowUpRight size={17}/></Link>}</Reveal>)}</div>
  </div>;
}
export default function StudioSection({ p: input = {} }) {
  const p = { ...STUDIO_DEFAULTS, ...input };
  const reduced = useReducedMotion();
  const enabled = p.motion !== 'none' && !reduced;
  const items = Array.isArray(p.items) ? p.items : [];
  const layout = p.layout;
  const style = { '--studio-bg': p.background, '--studio-fg': p.foreground, '--studio-accent': p.accent, '--studio-card': p.cardBackground, '--studio-font': fonts[p.font] || fonts.sans };
  const title = <><span className="studio-eyebrow">{p.eyebrow}</span>{layout === 'hero' ? <h1>{p.title}</h1> : <h2>{p.title}</h2>}<p className="studio-lead">{p.text}</p></>;
  return <section className={`studio-section studio-${layout} studio-align-${p.align} ${enabled ? 'studio-motion' : 'studio-still'}`} style={style}>
    <div className="studio-container">
      {layout === 'scrollStory' ? <ScrollStory p={p} items={items} enabled={enabled}/> :
      layout === 'marquee' ? <div className="studio-marquee"><span className="studio-eyebrow">{p.eyebrow}</span><h2 className="studio-sr-only">{p.title}</h2><div className="studio-marquee-track" aria-hidden="true">{[0,1].map(i=><span key={i}>{p.title}<Sparkles size={56}/>{p.title}<Sparkles size={56}/></span>)}</div><p className="studio-lead">{p.text}</p></div> :
      ['hero','split'].includes(layout) ? <div className="studio-hero-grid"><Reveal enabled={enabled} className="studio-hero-copy">{title}<Actions p={p}/><div className="studio-footnote"><span className="studio-dot"/>{p.caption}<ArrowDown size={16}/></div></Reveal><motion.div animate={enabled && p.motion === 'float' ? { y: [0,-12,0] } : undefined} transition={{ duration: 7, repeat: Infinity, ease: 'easeInOut' }}><Visual image={p.image} alt={p.imageAlt} caption={p.caption}/><div className="studio-image-note"><span>01 —</span><span>{p.eyebrow}</span><ArrowUpRight size={25}/></div></motion.div></div> :
      ['cta','contact'].includes(layout) ? <Reveal enabled={enabled} className="studio-invitation"><div>{title}<Actions p={p}/></div><span className="studio-invitation-arrow" aria-hidden="true">↗</span></Reveal> :
      <><Reveal enabled={enabled} className="studio-heading">{title}</Reveal>
      {layout === 'faq' ? <div className="studio-faq-list">{items.map((item,i)=><details key={i}><summary><span className="studio-index">{String(i+1).padStart(2,'0')}</span>{item.title}<Plus size={20}/></summary><p>{item.text}</p></details>)}</div> :
      layout === 'timeline' ? <ol className="studio-timeline">{items.map((item,i)=><li key={i}><Reveal enabled={enabled} index={i}><span className="studio-step-number">{String(i+1).padStart(2,'0')}</span><span className="studio-eyebrow">{item.eyebrow}</span><h3>{item.title}</h3><p>{item.text}</p>{item.label && <Link href={safeHref(item.href)} className="studio-text-link">{item.label}<ArrowUpRight size={16}/></Link>}</Reveal></li>)}</ol> :
      <div className={`studio-grid studio-grid-${layout}`}>{items.map((item,i)=><Reveal key={i} enabled={enabled} index={i} className="studio-card">
        {['gallery','team','bento'].includes(layout) && <Visual image={item.image} alt={item.title} index={i}/>}
        {layout === 'logos' ? <Link href={safeHref(item.href)} className="studio-logo">{item.image ? <img src={item.image} alt={item.title} loading="lazy"/> : <span>{item.title}</span>}</Link> :
        <div className="studio-card-copy"><span className="studio-eyebrow">{item.eyebrow}</span>
        {layout === 'reviews' ? <><span className="studio-quote-mark" aria-hidden="true">“</span><blockquote>{item.text}</blockquote><div className="studio-review-author">{item.image && <img src={item.image} alt="" loading="lazy"/>}<h3>{item.title}</h3></div></> :
        <>{['stats','pricing'].includes(layout) && <div className="studio-value">{item.value}</div>}<h3>{item.title}</h3><p>{item.text}</p>{item.href && item.label && <Link href={safeHref(item.href)} className={layout === 'pricing' ? 'studio-button' : 'studio-text-link'}>{item.label}<ArrowUpRight size={17}/></Link>}</>}
        </div>}
      </Reveal>)}</div>}
      </>}
    </div>
  </section>;
}
