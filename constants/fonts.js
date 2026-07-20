export const AVAILABLE_FONTS = [
  // System Fonts
  { id: "font-1", family: "Arial", value: "Arial, sans-serif", url: null, weight: "normal", style: "normal" },
  { id: "font-2", family: "Times New Roman", value: "Times New Roman, serif", url: null, weight: "normal", style: "normal" },
  { id: "font-3", family: "Courier New", value: "Courier New, monospace", url: null, weight: "normal", style: "normal" },
  { id: "font-4", family: "Georgia", value: "Georgia, serif", url: null, weight: "normal", style: "normal" },
  { id: "font-5", family: "Verdana", value: "Verdana, sans-serif", url: null, weight: "normal", style: "normal" },

  // Bahnschrift Font Family
  { id: "font-6", family: "Bahnschrift", value: "'Bahnschrift', sans-serif", url: "/fonts/Bahnschrift-Font-Family/BAHNSCHRIFT.TTF", weight: "normal", style: "normal" },
  { id: "font-7", family: "Bahnschrift Light", value: "'Bahnschrift Light', sans-serif", url: "/fonts/Bahnschrift-Font-Family/BAHNSCHRIFT 1.TTF", weight: "300", style: "normal" },
  { id: "font-8", family: "Bahnschrift SemiLight", value: "'Bahnschrift SemiLight', sans-serif", url: "/fonts/Bahnschrift-Font-Family/BAHNSCHRIFT 2.TTF", weight: "400", style: "normal" },
  { id: "font-9", family: "Bahnschrift SemiBold", value: "'Bahnschrift SemiBold', sans-serif", url: "/fonts/Bahnschrift-Font-Family/BAHNSCHRIFT 3.TTF", weight: "600", style: "normal" },
  { id: "font-10", family: "Bahnschrift Bold", value: "'Bahnschrift Bold', sans-serif", url: "/fonts/Bahnschrift-Font-Family/BAHNSCHRIFT 4.TTF", weight: "700", style: "normal" },
  { id: "font-11", family: "Bahnschrift ExtraBold", value: "'Bahnschrift ExtraBold', sans-serif", url: "/fonts/Bahnschrift-Font-Family/BAHNSCHRIFT 5.TTF", weight: "800", style: "normal" },
  { id: "font-12", family: "Bahnschrift Heavy", value: "'Bahnschrift Heavy', sans-serif", url: "/fonts/Bahnschrift-Font-Family/BAHNSCHRIFT 6.TTF", weight: "900", style: "normal" },
  { id: "font-13", family: "Bahnschrift Black", value: "'Bahnschrift Black', sans-serif", url: "/fonts/Bahnschrift-Font-Family/BAHNSCHRIFT 7.TTF", weight: "900", style: "normal" },
  { id: "font-14", family: "Bahnschrift Ultra", value: "'Bahnschrift Ultra', sans-serif", url: "/fonts/Bahnschrift-Font-Family/BAHNSCHRIFT 8.TTF", weight: "900", style: "normal" },
  { id: "font-15", family: "Bahnschrift Thin", value: "'Bahnschrift Thin', sans-serif", url: "/fonts/Bahnschrift-Font-Family/BAHNSCHRIFT 9.TTF", weight: "100", style: "normal" },
  { id: "font-16", family: "Bahnschrift ExtraLight", value: "'Bahnschrift ExtraLight', sans-serif", url: "/fonts/Bahnschrift-Font-Family/BAHNSCHRIFT 10.TTF", weight: "200", style: "normal" },
  { id: "font-17", family: "Bahnschrift Light Condensed", value: "'Bahnschrift Light Condensed', sans-serif", url: "/fonts/Bahnschrift-Font-Family/BAHNSCHRIFT 11.TTF", weight: "300", style: "normal" },
  { id: "font-18", family: "Bahnschrift Condensed", value: "'Bahnschrift Condensed', sans-serif", url: "/fonts/Bahnschrift-Font-Family/BAHNSCHRIFT 12.TTF", weight: "400", style: "normal" },
  { id: "font-19", family: "Bahnschrift Bold Condensed", value: "'Bahnschrift Bold Condensed', sans-serif", url: "/fonts/Bahnschrift-Font-Family/BAHNSCHRIFT 13.TTF", weight: "700", style: "normal" },
  { id: "font-20", family: "Bahnschrift ExtraBold Condensed", value: "'Bahnschrift ExtraBold Condensed', sans-serif", url: "/fonts/Bahnschrift-Font-Family/BAHNSCHRIFT 14.TTF", weight: "800", style: "normal" },

  // Evolventa Font Family
  { id: "font-21", family: "Evolventa", value: "'Evolventa', sans-serif", url: "/fonts/evolventa-webfont/Evolventa-Regular.woff", weight: "normal", style: "normal" },
  { id: "font-22", family: "Evolventa Oblique", value: "'Evolventa Oblique', sans-serif", url: "/fonts/evolventa-webfont/Evolventa-Oblique.woff", weight: "normal", style: "italic" },
  { id: "font-23", family: "Evolventa Bold", value: "'Evolventa Bold', sans-serif", url: "/fonts/evolventa-webfont/Evolventa-Bold.woff", weight: "700", style: "normal" },
  { id: "font-24", family: "Evolventa Bold Oblique", value: "'Evolventa Bold Oblique', sans-serif", url: "/fonts/evolventa-webfont/Evolventa-BoldOblique.woff", weight: "700", style: "italic" },

  // Georgia Pro Font Family
  { id: "font-25", family: "Georgia Pro", value: "'Georgia Pro', serif", url: "/fonts/georgia-pro/GeorgiaPro-Regular.ttf", weight: "normal", style: "normal" },
  { id: "font-26", family: "Georgia Pro Italic", value: "'Georgia Pro Italic', serif", url: "/fonts/georgia-pro/GeorgiaPro-Italic.ttf", weight: "normal", style: "italic" },
  { id: "font-27", family: "Georgia Pro Light", value: "'Georgia Pro Light', serif", url: "/fonts/georgia-pro/GeorgiaPro-Light.ttf", weight: "300", style: "normal" },
  { id: "font-28", family: "Georgia Pro Light Italic", value: "'Georgia Pro Light Italic', serif", url: "/fonts/georgia-pro/GeorgiaPro-LightItalic.ttf", weight: "300", style: "italic" },
  { id: "font-29", family: "Georgia Pro Semibold", value: "'Georgia Pro Semibold', serif", url: "/fonts/georgia-pro/GeorgiaPro-Semibold.ttf", weight: "600", style: "normal" },
  { id: "font-30", family: "Georgia Pro Semibold Italic", value: "'Georgia Pro Semibold Italic', serif", url: "/fonts/georgia-pro/GeorgiaPro-SemiboldItalic.ttf", weight: "600", style: "italic" },
  { id: "font-31", family: "Georgia Pro Bold", value: "'Georgia Pro Bold', serif", url: "/fonts/georgia-pro/GeorgiaPro-Bold.ttf", weight: "700", style: "normal" },
  { id: "font-32", family: "Georgia Pro Bold Italic", value: "'Georgia Pro Bold Italic', serif", url: "/fonts/georgia-pro/GeorgiaPro-BoldItalic.ttf", weight: "700", style: "italic" },
  { id: "font-33", family: "Georgia Pro Black", value: "'Georgia Pro Black', serif", url: "/fonts/georgia-pro/GeorgiaPro-Black.ttf", weight: "900", style: "normal" },
  { id: "font-34", family: "Georgia Pro Black Italic", value: "'Georgia Pro Black Italic', serif", url: "/fonts/georgia-pro/GeorgiaPro-BlackItalic.ttf", weight: "900", style: "italic" },
  { id: "font-35", family: "Georgia Pro Condensed", value: "'Georgia Pro Condensed', serif", url: "/fonts/georgia-pro/GeorgiaPro-CondRegular.ttf", weight: "normal", style: "normal" },
  { id: "font-36", family: "Georgia Pro Condensed Italic", value: "'Georgia Pro Condensed Italic', serif", url: "/fonts/georgia-pro/GeorgiaPro-CondItalic.ttf", weight: "normal", style: "italic" },
  { id: "font-37", family: "Georgia Pro Condensed Light", value: "'Georgia Pro Condensed Light', serif", url: "/fonts/georgia-pro/GeorgiaPro-CondLight.ttf", weight: "300", style: "normal" },
  { id: "font-38", family: "Georgia Pro Condensed Light Italic", value: "'Georgia Pro Condensed Light Italic', serif", url: "/fonts/georgia-pro/GeorgiaPro-CondLightItalic.ttf", weight: "300", style: "italic" },
  { id: "font-39", family: "Georgia Pro Condensed Bold", value: "'Georgia Pro Condensed Bold', serif", url: "/fonts/georgia-pro/GeorgiaPro-CondBold.ttf", weight: "700", style: "normal" },
  { id: "font-40", family: "Georgia Pro Condensed Bold Italic", value: "'Georgia Pro Condensed Bold Italic', serif", url: "/fonts/georgia-pro/GeorgiaPro-CondBoldItalic.ttf", weight: "700", style: "italic" },
  { id: "font-41", family: "Georgia Pro Condensed Black", value: "'Georgia Pro Condensed Black', serif", url: "/fonts/georgia-pro/GeorgiaPro-CondBlack.ttf", weight: "900", style: "normal" },
  { id: "font-42", family: "Georgia Pro Condensed Black Italic", value: "'Georgia Pro Condensed Black Italic', serif", url: "/fonts/georgia-pro/GeorgiaPro-CondBlackItalic.ttf", weight: "900", style: "italic" },
  { id: "font-43", family: "Georgia Pro Condensed Semibold", value: "'Georgia Pro Condensed Semibold', serif", url: "/fonts/georgia-pro/GeorgiaPro-CondSemibold.ttf", weight: "600", style: "normal" },
  { id: "font-44", family: "Georgia Pro Condensed Semibold Italic", value: "'Georgia Pro Condensed Semibold Italic', serif", url: "/fonts/georgia-pro/GeorgiaPro-CondSemiboldItalic.ttf", weight: "600", style: "italic" },

  // Lucida Sans Font Family
  { id: "font-45", family: "Lucida Sans", value: "'Lucida Sans', sans-serif", url: "/fonts/lucida-sans/LSANS.TTF", weight: "normal", style: "normal" },
  { id: "font-46", family: "Lucida Sans Italic", value: "'Lucida Sans Italic', sans-serif", url: "/fonts/lucida-sans/LSANSI.TTF", weight: "normal", style: "italic" },
  { id: "font-47", family: "Lucida Sans Demi", value: "'Lucida Sans Demi', sans-serif", url: "/fonts/lucida-sans/LSANSD.TTF", weight: "600", style: "normal" },
  { id: "font-48", family: "Lucida Sans Demi Italic", value: "'Lucida Sans Demi Italic', sans-serif", url: "/fonts/lucida-sans/LSANSDI.TTF", weight: "600", style: "italic" },
  { id: "font-49", family: "Lucida Typewriter", value: "'Lucida Typewriter', monospace", url: "/fonts/lucida-sans/LTYPE.TTF", weight: "normal", style: "normal" },
  { id: "font-50", family: "Lucida Typewriter Oblique", value: "'Lucida Typewriter Oblique', monospace", url: "/fonts/lucida-sans/LTYPEO.TTF", weight: "normal", style: "italic" },
  { id: "font-51", family: "Lucida Typewriter Bold", value: "'Lucida Typewriter Bold', monospace", url: "/fonts/lucida-sans/LTYPEB.TTF", weight: "700", style: "normal" },
  { id: "font-52", family: "Lucida Typewriter Bold Oblique", value: "'Lucida Typewriter Bold Oblique', monospace", url: "/fonts/lucida-sans/LTYPEBO.TTF", weight: "700", style: "italic" },
  { id: "font-53", family: "Lucida Sans Unicode", value: "'Lucida Sans Unicode', sans-serif", url: "/fonts/lucida-sans/l_10646.ttf", weight: "normal", style: "normal" },

  // Montserrat Font Family
  { id: "font-54", family: "Montserrat", value: "'Montserrat', sans-serif", url: "/fonts/Montserrat/Montserrat-VariableFont_wght.ttf", weight: "normal", style: "normal" },
  { id: "font-55", family: "Montserrat Italic", value: "'Montserrat Italic', sans-serif", url: "/fonts/Montserrat/Montserrat-Italic-VariableFont_wght.ttf", weight: "normal", style: "italic" },
  { id: "font-56", family: "Montserrat Thin", value: "'Montserrat Thin', sans-serif", url: "/fonts/Montserrat/static/Montserrat-Thin.ttf", weight: "100", style: "normal" },
  { id: "font-57", family: "Montserrat Thin Italic", value: "'Montserrat Thin Italic', sans-serif", url: "/fonts/Montserrat/static/Montserrat-ThinItalic.ttf", weight: "100", style: "italic" },
  { id: "font-58", family: "Montserrat ExtraLight", value: "'Montserrat ExtraLight', sans-serif", url: "/fonts/Montserrat/static/Montserrat-ExtraLight.ttf", weight: "200", style: "normal" },
  { id: "font-59", family: "Montserrat ExtraLight Italic", value: "'Montserrat ExtraLight Italic', sans-serif", url: "/fonts/Montserrat/static/Montserrat-ExtraLightItalic.ttf", weight: "200", style: "italic" },
  { id: "font-60", family: "Montserrat Light", value: "'Montserrat Light', sans-serif", url: "/fonts/Montserrat/static/Montserrat-Light.ttf", weight: "300", style: "normal" },
  { id: "font-61", family: "Montserrat Light Italic", value: "'Montserrat Light Italic', sans-serif", url: "/fonts/Montserrat/static/Montserrat-LightItalic.ttf", weight: "300", style: "italic" },
  { id: "font-62", family: "Montserrat Regular", value: "'Montserrat Regular', sans-serif", url: "/fonts/Montserrat/static/Montserrat-Regular.ttf", weight: "normal", style: "normal" },
  { id: "font-63", family: "Montserrat Italic", value: "'Montserrat Italic', sans-serif", url: "/fonts/Montserrat/static/Montserrat-Italic.ttf", weight: "normal", style: "italic" },
  { id: "font-64", family: "Montserrat Medium", value: "'Montserrat Medium', sans-serif", url: "/fonts/Montserrat/static/Montserrat-Medium.ttf", weight: "500", style: "normal" },
  { id: "font-65", family: "Montserrat Medium Italic", value: "'Montserrat Medium Italic', sans-serif", url: "/fonts/Montserrat/static/Montserrat-MediumItalic.ttf", weight: "500", style: "italic" },
  { id: "font-66", family: "Montserrat SemiBold", value: "'Montserrat SemiBold', sans-serif", url: "/fonts/Montserrat/static/Montserrat-SemiBold.ttf", weight: "600", style: "normal" },
  { id: "font-67", family: "Montserrat SemiBold Italic", value: "'Montserrat SemiBold Italic', sans-serif", url: "/fonts/Montserrat/static/Montserrat-SemiBoldItalic.ttf", weight: "600", style: "italic" },
  { id: "font-68", family: "Montserrat Bold", value: "'Montserrat Bold', sans-serif", url: "/fonts/Montserrat/static/Montserrat-Bold.ttf", weight: "700", style: "normal" },
  { id: "font-69", family: "Montserrat Bold Italic", value: "'Montserrat Bold Italic', sans-serif", url: "/fonts/Montserrat/static/Montserrat-BoldItalic.ttf", weight: "700", style: "italic" },
  { id: "font-70", family: "Montserrat ExtraBold", value: "'Montserrat ExtraBold', sans-serif", url: "/fonts/Montserrat/static/Montserrat-ExtraBold.ttf", weight: "800", style: "normal" },
  { id: "font-71", family: "Montserrat ExtraBold Italic", value: "'Montserrat ExtraBold Italic', sans-serif", url: "/fonts/Montserrat/static/Montserrat-ExtraBoldItalic.ttf", weight: "800", style: "italic" },
  { id: "font-72", family: "Montserrat Black", value: "'Montserrat Black', sans-serif", url: "/fonts/Montserrat/static/Montserrat-Black.ttf", weight: "900", style: "normal" },
  { id: "font-73", family: "Montserrat Black Italic", value: "'Montserrat Black Italic', sans-serif", url: "/fonts/Montserrat/static/Montserrat-BlackItalic.ttf", weight: "900", style: "italic" },

  // Source Sans 3 Font Family
  { id: "font-74", family: "Source Sans 3", value: "'Source Sans 3', sans-serif", url: "/fonts/Source_Sans_3/SourceSans3-VariableFont_wght.ttf", weight: "normal", style: "normal" },
  { id: "font-75", family: "Source Sans 3 Italic", value: "'Source Sans 3 Italic', sans-serif", url: "/fonts/Source_Sans_3/SourceSans3-Italic-VariableFont_wght.ttf", weight: "normal", style: "italic" },
  { id: "font-76", family: "Source Sans 3 ExtraLight", value: "'Source Sans 3 ExtraLight', sans-serif", url: "/fonts/Source_Sans_3/static/SourceSans3-ExtraLight.ttf", weight: "200", style: "normal" },
  { id: "font-77", family: "Source Sans 3 ExtraLight Italic", value: "'Source Sans 3 ExtraLight Italic', sans-serif", url: "/fonts/Source_Sans_3/static/SourceSans3-ExtraLightItalic.ttf", weight: "200", style: "italic" },
  { id: "font-78", family: "Source Sans 3 Light", value: "'Source Sans 3 Light', sans-serif", url: "/fonts/Source_Sans_3/static/SourceSans3-Light.ttf", weight: "300", style: "normal" },
  { id: "font-79", family: "Source Sans 3 Light Italic", value: "'Source Sans 3 Light Italic', sans-serif", url: "/fonts/Source_Sans_3/static/SourceSans3-LightItalic.ttf", weight: "300", style: "italic" },
  { id: "font-80", family: "Source Sans 3 Regular", value: "'Source Sans 3 Regular', sans-serif", url: "/fonts/Source_Sans_3/static/SourceSans3-Regular.ttf", weight: "normal", style: "normal" },
  { id: "font-81", family: "Source Sans 3 Italic", value: "'Source Sans 3 Italic', sans-serif", url: "/fonts/Source_Sans_3/static/SourceSans3-Italic.ttf", weight: "normal", style: "italic" },
  { id: "font-82", family: "Source Sans 3 Medium", value: "'Source Sans 3 Medium', sans-serif", url: "/fonts/Source_Sans_3/static/SourceSans3-Medium.ttf", weight: "500", style: "normal" },
  { id: "font-83", family: "Source Sans 3 Medium Italic", value: "'Source Sans 3 Medium Italic', sans-serif", url: "/fonts/Source_Sans_3/static/SourceSans3-MediumItalic.ttf", weight: "500", style: "italic" },
  { id: "font-84", family: "Source Sans 3 SemiBold", value: "'Source Sans 3 SemiBold', sans-serif", url: "/fonts/Source_Sans_3/static/SourceSans3-SemiBold.ttf", weight: "600", style: "normal" },
  { id: "font-85", family: "Source Sans 3 SemiBold Italic", value: "'Source Sans 3 SemiBold Italic', sans-serif", url: "/fonts/Source_Sans_3/static/SourceSans3-SemiBoldItalic.ttf", weight: "600", style: "italic" },
  { id: "font-86", family: "Source Sans 3 Bold", value: "'Source Sans 3 Bold', sans-serif", url: "/fonts/Source_Sans_3/static/SourceSans3-Bold.ttf", weight: "700", style: "normal" },
  { id: "font-87", family: "Source Sans 3 Bold Italic", value: "'Source Sans 3 Bold Italic', sans-serif", url: "/fonts/Source_Sans_3/static/SourceSans3-BoldItalic.ttf", weight: "700", style: "italic" },
  { id: "font-88", family: "Source Sans 3 ExtraBold", value: "'Source Sans 3 ExtraBold', sans-serif", url: "/fonts/Source_Sans_3/static/SourceSans3-ExtraBold.ttf", weight: "800", style: "normal" },
  { id: "font-89", family: "Source Sans 3 ExtraBold Italic", value: "'Source Sans 3 ExtraBold Italic', sans-serif", url: "/fonts/Source_Sans_3/static/SourceSans3-ExtraBoldItalic.ttf", weight: "800", style: "italic" },
  { id: "font-90", family: "Source Sans 3 Black", value: "'Source Sans 3 Black', sans-serif", url: "/fonts/Source_Sans_3/static/SourceSans3-Black.ttf", weight: "900", style: "normal" },
  { id: "font-91", family: "Source Sans 3 Black Italic", value: "'Source Sans 3 Black Italic', sans-serif", url: "/fonts/Source_Sans_3/static/SourceSans3-BlackItalic.ttf", weight: "900", style: "italic" },

  // Anton
  { id: "font-92", family: "Anton", value: "'Anton', sans-serif", url: "/fonts/Anton/Anton-Regular.ttf", weight: "normal", style: "normal" },
];

// Function to dynamically load all custom fonts
export async function loadCustomFonts() {
  const loadedFonts = [];
  
  for (const font of AVAILABLE_FONTS) {
    if (font.url && !document.fonts.check(`12px "${font.family}"`)) {
      try {
        const fontFace = new FontFace(font.family, `url(${font.url})`, {
          weight: font.weight,
          style: font.style
        });
        const loadedFont = await fontFace.load();
        document.fonts.add(loadedFont);
        loadedFonts.push(font.family);
        console.log(`Loaded font: ${font.family}`);
      } catch (e) {
        console.warn(`Failed to load font ${font.family}:`, e);
      }
    }
  }
  
  return loadedFonts;
}

// Helper to get fonts for select dropdown with grouping
export function getFontOptions() {
  const groups = {
    system: { label: "System Fonts", fonts: [] },
    bahnschrift: { label: "Bahnschrift Family", fonts: [] },
    evolventa: { label: "Evolventa Family", fonts: [] },
    georgia: { label: "Georgia Pro Family", fonts: [] },
    lucida: { label: "Lucida Sans Family", fonts: [] },
    montserrat: { label: "Montserrat Family", fonts: [] },
    sourcesans: { label: "Source Sans 3 Family", fonts: [] }
  };
  
  for (const font of AVAILABLE_FONTS) {
    if (font.family === "Arial" || font.family === "Times New Roman" || font.family === "Courier New" || 
        font.family === "Georgia" || font.family === "Verdana") {
      groups.system.fonts.push(font);
    } else if (font.family.includes("Bahnschrift")) {
      groups.bahnschrift.fonts.push(font);
    } else if (font.family.includes("Evolventa")) {
      groups.evolventa.fonts.push(font);
    } else if (font.family.includes("Georgia Pro")) {
      groups.georgia.fonts.push(font);
    } else if (font.family.includes("Lucida")) {
      groups.lucida.fonts.push(font);
    } else if (font.family.includes("Montserrat")) {
      groups.montserrat.fonts.push(font);
    } else if (font.family.includes("Source Sans")) {
      groups.sourcesans.fonts.push(font);
    }
  }
  
  return groups;
}

// Helper to get font family by name
export function getFontFamily(fontName) {
  const font = AVAILABLE_FONTS.find(f => f.family === fontName);
  return font ? font.value : fontName;
}