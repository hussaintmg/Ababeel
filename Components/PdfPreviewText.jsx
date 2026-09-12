"use client";
import { useLayoutEffect, useRef } from 'react';
import { loadCustomFonts } from '@/constants/fonts';
import { fitPreviewText } from '@/utils/fitPreviewText';

export default function PdfPreviewText({html, style, zoom, ...props}) {
  const ref = useRef(null);
  useLayoutEffect(() => {
    const element = ref.current;
    if (!element) return;
    let active = true;
    const restore = () => {
      element.style.fontSize = style.fontSize || '';
      element.style.whiteSpace = style.whiteSpace || '';
      element.innerHTML = html;
      delete element.dataset.textFit;
      element.title = '';
    };
    restore();
    const family = getComputedStyle(element).fontFamily.split(',')[0].replace(/['"]/g,'').trim();
    loadCustomFonts([family]).then(() => {
      if (!active) return;
      restore();
      fitPreviewText(element, zoom);
    });
    return () => { active = false; };
  }, [html, style, zoom]);
  return <div {...props} ref={ref} style={style} dangerouslySetInnerHTML={{__html:html}} />;
}
