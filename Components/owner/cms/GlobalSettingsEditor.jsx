"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import Link from "next/link";
import { toast } from "react-toastify";
import {
  Save, Loader2, ArrowLeft, Palette, Phone, ImageIcon, Search, Menu,
  PanelBottom, Share2, Code2, LayoutDashboard, KeyRound, Wrench,
} from "lucide-react";
import {
  Label, TextInput, TextArea, ImagePicker, Toggle, ListEditor, ColorInput, SelectInput,
} from "@/Components/owner/cms/fields";
import { useSiteContent } from "@/context/SiteContentContext";

const TABS = [
  { id: "brand", label: "Branding", icon: Palette },
  { id: "contact", label: "Contact", icon: Phone },
  { id: "logos", label: "Logos & Favicon", icon: ImageIcon },
  { id: "seo", label: "Title & SEO", icon: Search },
  { id: "topbar", label: "Navigation", icon: Menu },
  { id: "footer", label: "Footer", icon: PanelBottom },
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { id: "auth", label: "Auth Pages", icon: KeyRound },
  { id: "maintenance", label: "Maintenance", icon: Wrench },
  { id: "social", label: "Social", icon: Share2 },
  { id: "css", label: "Global CSS", icon: Code2 },
];

// immutable nested set: setIn(obj, ["a","b"], v)
function setIn(obj, path, value) {
  if (path.length === 0) return value;
  const [head, ...rest] = path;
  return { ...obj, [head]: setIn(obj?.[head] ?? {}, rest, value) };
}

export default function GlobalSettingsEditor({ meta }) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState(null);
  const [customCss, setCustomCss] = useState("");
  const [tab, setTab] = useState("brand");
  const { refresh } = useSiteContent();

  useEffect(() => {
    axios
      .get("/api/owner/cms/global", { withCredentials: true })
      .then((res) => {
        const d = res.data?.data;
        if (d) {
          setSettings(d.settings || {});
          setCustomCss(d.customCss || "");
        }
      })
      .catch(() => toast.error("Failed to load settings"))
      .finally(() => setLoading(false));
  }, []);

  const set = (path, value) => setSettings((prev) => setIn(prev, path, value));

  const save = async () => {
    setSaving(true);
    try {
      await axios.put(
        "/api/owner/cms/global",
        { settings, customCss, enabled: true },
        { withCredentials: true }
      );
      toast.success("Site settings saved");
      refresh?.(); // update live topbar/footer/favicon immediately
    } catch (e) {
      toast.error(e?.response?.data?.error || "Save failed");
    } finally {
      setSaving(false);
    }
  };

  if (loading || !settings) {
    return (
      <div className="flex items-center justify-center py-24 text-gray-500">
        <Loader2 className="animate-spin mr-2" /> Loading settings…
      </div>
    );
  }

  const s = settings;

  return (
    <div className="pb-24">
      {/* Toolbar */}
      <div className="sticky top-16 md:top-20 z-20 -mx-4 md:-mx-6 px-4 md:px-6 py-3 bg-white/90 backdrop-blur border-b border-gray-200 flex items-center gap-3">
        <Link href="/owner/cms" className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-800">
          <ArrowLeft size={16} /> All Pages
        </Link>
        <div className="h-5 w-px bg-gray-200" />
        <h1 className="font-semibold text-gray-900">Global Site Settings</h1>
        <button
          onClick={save}
          disabled={saving}
          className="ml-auto inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-60"
        >
          {saving ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />}
          Save
        </button>
      </div>

      <div className="mt-5 grid grid-cols-1 lg:grid-cols-[220px_minmax(0,1fr)] gap-6">
        {/* Tabs */}
        <nav className="flex lg:flex-col gap-1 overflow-x-auto lg:overflow-visible">
          {TABS.map((t) => {
            const Icon = t.icon;
            const active = tab === t.id;
            return (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={`flex items-center gap-2.5 px-3.5 py-2.5 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                  active ? "bg-blue-600 text-white shadow-sm" : "text-gray-600 hover:bg-gray-100"
                }`}
              >
                <Icon size={16} /> {t.label}
              </button>
            );
          })}
        </nav>

        {/* Panel */}
        <div className="rounded-2xl border border-gray-200 bg-white p-5 md:p-6 max-w-3xl">
          {tab === "brand" ? (
            <Section title="Branding" desc="Names used across the site, emails and documents.">
              <Grid2>
                <F label="Brand name"><TextInput value={s.brand?.name} onChange={(v) => set(["brand", "name"], v)} /></F>
                <F label="Short name"><TextInput value={s.brand?.shortName} onChange={(v) => set(["brand", "shortName"], v)} /></F>
                <F label="Legal name"><TextInput value={s.brand?.legalName} onChange={(v) => set(["brand", "legalName"], v)} /></F>
                <F label="Tagline"><TextInput value={s.brand?.tagline} onChange={(v) => set(["brand", "tagline"], v)} /></F>
              </Grid2>
              <F label="Description"><TextArea value={s.brand?.description} onChange={(v) => set(["brand", "description"], v)} /></F>
            </Section>
          ) : null}

          {tab === "contact" ? (
            <Section title="Contact details" desc="Shown in the footer and used for enquiries.">
              <Grid2>
                <F label="Support email"><TextInput value={s.contact?.supportEmail} onChange={(v) => set(["contact", "supportEmail"], v)} /></F>
                <F label="Info email"><TextInput value={s.contact?.infoEmail} onChange={(v) => set(["contact", "infoEmail"], v)} /></F>
                <F label="Phone"><TextInput value={s.contact?.phone} onChange={(v) => set(["contact", "phone"], v)} /></F>
                <F label="WhatsApp"><TextInput value={s.contact?.whatsapp} onChange={(v) => set(["contact", "whatsapp"], v)} /></F>
                <F label="Country"><TextInput value={s.contact?.country} onChange={(v) => set(["contact", "country"], v)} /></F>
              </Grid2>
              <F label="Address"><TextArea value={s.contact?.address} onChange={(v) => set(["contact", "address"], v)} /></F>
            </Section>
          ) : null}

          {tab === "logos" ? (
            <Section title="Logos & Favicon" desc="Upload or paste a URL. Favicon can be .png, .ico or .svg.">
              <F label="Topbar logo"><ImagePicker value={s.logos?.topbar} onChange={(v) => set(["logos", "topbar"], v)} /></F>
              <F label="Footer logo"><ImagePicker value={s.logos?.footer} onChange={(v) => set(["logos", "footer"], v)} /></F>
              <F label="Favicon (browser tab icon)"><ImagePicker value={s.logos?.favicon} onChange={(v) => set(["logos", "favicon"], v)} /></F>
            </Section>
          ) : null}

          {tab === "seo" ? (
            <Section title="Title & SEO" desc="Controls the browser tab title and default meta description.">
              <F label="Title template (use %s for page name)">
                <TextInput value={s.seo?.titleTemplate} onChange={(v) => set(["seo", "titleTemplate"], v)} />
              </F>
              <F label="Default title"><TextInput value={s.seo?.defaultTitle} onChange={(v) => set(["seo", "defaultTitle"], v)} /></F>
              <F label="Default description"><TextArea value={s.seo?.defaultDescription} onChange={(v) => set(["seo", "defaultDescription"], v)} /></F>
              <p className="text-xs text-gray-400">Preview: <b>{(s.seo?.titleTemplate || "%s | Ababeel").replace("%s", "About Us")}</b></p>
            </Section>
          ) : null}

          {tab === "topbar" ? (
            <Section title="Topbar navigation" desc="Menu links shown in the site header and mobile menu.">
              <F label="Show login button">
                <Toggle value={s.topbar?.showLogin !== false} onChange={(v) => set(["topbar", "showLogin"], v)} label="Show login/dashboard button" />
              </F>
              <F label="Menu links">
                <ListEditor
                  field={{
                    itemLabel: "Link",
                    itemFields: [
                      { key: "name", type: "text", label: "Label" },
                      { key: "url", type: "text", label: "URL" },
                    ],
                  }}
                  value={s.topbar?.navLinks}
                  onChange={(v) => set(["topbar", "navLinks"], v)}
                />
              </F>

              <SubSection title="Bar" desc="Header background, border and shadow. Leave a color blank to keep the default.">
                <Grid2>
                  <F label="Background color"><ColorInput value={s.topbar?.style?.bg} onChange={(v) => set(["topbar", "style", "bg"], v)} /></F>
                  <F label="Bottom border color"><ColorInput value={s.topbar?.style?.borderColor} onChange={(v) => set(["topbar", "style", "borderColor"], v)} /></F>
                </Grid2>
                <F label="Shadow"><Toggle value={s.topbar?.style?.shadow !== false} onChange={(v) => set(["topbar", "style", "shadow"], v)} label="Show header shadow" /></F>
              </SubSection>

              <SubSection title="Layout" desc="Width, alignment and sizes of the header.">
                <Grid2>
                  <F label="Container width"><SelectInput value={s.topbar?.style?.container || "wide"} onChange={(v) => set(["topbar", "style", "container"], v)} options={[{ value: "wide", label: "wide" }, { value: "normal", label: "normal" }, { value: "full", label: "full width" }]} /></F>
                  <F label="Menu alignment"><SelectInput value={s.topbar?.style?.navAlign || "center"} onChange={(v) => set(["topbar", "style", "navAlign"], v)} options={[{ value: "left", label: "left" }, { value: "center", label: "center" }, { value: "right", label: "right" }]} /></F>
                  <F label="Bar height (px)"><TextInput value={s.topbar?.style?.height} onChange={(v) => set(["topbar", "style", "height"], v)} placeholder="e.g. 80" /></F>
                  <F label="Logo size (px)"><TextInput value={s.topbar?.style?.logoHeight} onChange={(v) => set(["topbar", "style", "logoHeight"], v)} placeholder="e.g. 96" /></F>
                </Grid2>
              </SubSection>

              <SubSection title="Menu links" desc="Colors for the top navigation links, including hover and the current page.">
                <Grid2>
                  <F label="Link color"><ColorInput value={s.topbar?.style?.text} onChange={(v) => set(["topbar", "style", "text"], v)} /></F>
                  <F label="Link hover color"><ColorInput value={s.topbar?.style?.hover} onChange={(v) => set(["topbar", "style", "hover"], v)} /></F>
                  <F label="Link hover background"><ColorInput value={s.topbar?.style?.hoverBg} onChange={(v) => set(["topbar", "style", "hoverBg"], v)} /></F>
                  <F label="Active link color"><ColorInput value={s.topbar?.style?.activeText} onChange={(v) => set(["topbar", "style", "activeText"], v)} /></F>
                  <F label="Active link background"><ColorInput value={s.topbar?.style?.activeBg} onChange={(v) => set(["topbar", "style", "activeBg"], v)} /></F>
                </Grid2>
              </SubSection>

              <SubSection title="Dropdown menus" desc="The sub-menus that open under a nav item.">
                <Grid2>
                  <F label="Background"><ColorInput value={s.topbar?.style?.ddBg} onChange={(v) => set(["topbar", "style", "ddBg"], v)} /></F>
                  <F label="Text color"><ColorInput value={s.topbar?.style?.ddText} onChange={(v) => set(["topbar", "style", "ddText"], v)} /></F>
                  <F label="Item hover color"><ColorInput value={s.topbar?.style?.ddHover} onChange={(v) => set(["topbar", "style", "ddHover"], v)} /></F>
                  <F label="Item hover background"><ColorInput value={s.topbar?.style?.ddHoverBg} onChange={(v) => set(["topbar", "style", "ddHoverBg"], v)} /></F>
                </Grid2>
              </SubSection>

              <SubSection title="Login / Dashboard button" desc="The blue action button on the right of the header.">
                <Grid2>
                  <F label="Button background"><ColorInput value={s.topbar?.style?.btnBg} onChange={(v) => set(["topbar", "style", "btnBg"], v)} /></F>
                  <F label="Button text"><ColorInput value={s.topbar?.style?.btnText} onChange={(v) => set(["topbar", "style", "btnText"], v)} /></F>
                  <F label="Button hover background"><ColorInput value={s.topbar?.style?.btnHoverBg} onChange={(v) => set(["topbar", "style", "btnHoverBg"], v)} /></F>
                </Grid2>
              </SubSection>

              <SubSection title="User menu" desc="The dropdown that opens from the Dashboard button when logged in.">
                <Grid2>
                  <F label="Background"><ColorInput value={s.topbar?.style?.menuBg} onChange={(v) => set(["topbar", "style", "menuBg"], v)} /></F>
                  <F label="Text color"><ColorInput value={s.topbar?.style?.menuText} onChange={(v) => set(["topbar", "style", "menuText"], v)} /></F>
                  <F label="Item hover background"><ColorInput value={s.topbar?.style?.menuHover} onChange={(v) => set(["topbar", "style", "menuHover"], v)} /></F>
                </Grid2>
              </SubSection>
            </Section>
          ) : null}

          {tab === "footer" ? (
            <Section title="Footer" desc="Description, link columns and bottom bar.">
              <F label="Footer description"><TextArea value={s.footer?.description} onChange={(v) => set(["footer", "description"], v)} rows={4} /></F>
              <Grid2>
                <F label="Show email"><Toggle value={s.footer?.showEmail !== false} onChange={(v) => set(["footer", "showEmail"], v)} label="Show email block" /></F>
                <F label="Show address"><Toggle value={s.footer?.showAddress !== false} onChange={(v) => set(["footer", "showAddress"], v)} label="Show address block" /></F>
              </Grid2>
              <F label="Copyright text"><TextInput value={s.footer?.copyright} onChange={(v) => set(["footer", "copyright"], v)} /></F>

              <FooterColumns columns={s.footer?.columns || []} onChange={(v) => set(["footer", "columns"], v)} />

              <F label="Bottom bar links">
                <ListEditor
                  field={{
                    itemLabel: "Link",
                    itemFields: [
                      { key: "name", type: "text", label: "Label" },
                      { key: "href", type: "text", label: "URL" },
                    ],
                  }}
                  value={s.footer?.bottomLinks}
                  onChange={(v) => set(["footer", "bottomLinks"], v)}
                />
              </F>

              <SubSection title="Appearance" desc="Colors of the footer. Leave a color blank to keep the default dark theme.">
                <Grid2>
                  <F label="Background color"><ColorInput value={s.footer?.style?.bg} onChange={(v) => set(["footer", "style", "bg"], v)} /></F>
                  <F label="Text color"><ColorInput value={s.footer?.style?.text} onChange={(v) => set(["footer", "style", "text"], v)} /></F>
                  <F label="Heading color"><ColorInput value={s.footer?.style?.heading} onChange={(v) => set(["footer", "style", "heading"], v)} /></F>
                  <F label="Link color"><ColorInput value={s.footer?.style?.link} onChange={(v) => set(["footer", "style", "link"], v)} /></F>
                  <F label="Link hover color"><ColorInput value={s.footer?.style?.linkHover} onChange={(v) => set(["footer", "style", "linkHover"], v)} /></F>
                  <F label="Divider color"><ColorInput value={s.footer?.style?.borderColor} onChange={(v) => set(["footer", "style", "borderColor"], v)} /></F>
                </Grid2>
              </SubSection>

              <SubSection title="Layout" desc="Alignment and how many columns the top row uses.">
                <Grid2>
                  <F label="Content alignment"><SelectInput value={s.footer?.style?.align || ""} onChange={(v) => set(["footer", "style", "align"], v)} options={[{ value: "", label: "default (left)" }, { value: "center", label: "center" }]} /></F>
                  <F label="Top row columns"><SelectInput value={s.footer?.style?.columns || ""} onChange={(v) => set(["footer", "style", "columns"], v)} options={[{ value: "", label: "auto" }, { value: "2", label: "2" }, { value: "3", label: "3" }, { value: "4", label: "4" }, { value: "5", label: "5" }]} /></F>
                </Grid2>
              </SubSection>
            </Section>
          ) : null}

          {tab === "dashboard" ? (
            <Section title="Dashboard appearance" desc="Style the owner, admin and user dashboards. This only changes colors, spacing and layout — never the content or the real data shown inside.">
              <SubSection title="Colors" desc="Leave a color blank to keep the built-in look.">
                <Grid2>
                  <F label="Page background"><ColorInput value={s.dashboard?.style?.bg} onChange={(v) => set(["dashboard", "style", "bg"], v)} /></F>
                  <F label="Base text color"><ColorInput value={s.dashboard?.style?.text} onChange={(v) => set(["dashboard", "style", "text"], v)} /></F>
                  <F label="Accent color"><ColorInput value={s.dashboard?.style?.accent} onChange={(v) => set(["dashboard", "style", "accent"], v)} /></F>
                  <F label="Card background"><ColorInput value={s.dashboard?.style?.cardBg} onChange={(v) => set(["dashboard", "style", "cardBg"], v)} /></F>
                  <F label="Sidebar background"><ColorInput value={s.dashboard?.style?.sidebarBg} onChange={(v) => set(["dashboard", "style", "sidebarBg"], v)} /></F>
                  <F label="Sidebar text"><ColorInput value={s.dashboard?.style?.sidebarText} onChange={(v) => set(["dashboard", "style", "sidebarText"], v)} /></F>
                </Grid2>
                <p className="text-xs text-gray-400">The accent color recolors the dashboards&apos; blue buttons, links and highlights, and is available as the <span className="font-mono">--dash-accent</span> CSS variable.</p>
              </SubSection>

              <SubSection title="Layout">
                <Grid2>
                  <F label="Content max width (px)"><TextInput value={s.dashboard?.style?.contentWidth} onChange={(v) => set(["dashboard", "style", "contentWidth"], v)} placeholder="e.g. 1200 (blank = full)" /></F>
                </Grid2>
              </SubSection>

              <SubSection title="Custom dashboard CSS (advanced)" desc="Full control — target elements with a .cms-dash prefix, e.g. .cms-dash aside { ... }. CSS can only restyle, never change data.">
                <textarea
                  value={s.dashboard?.css || ""}
                  onChange={(e) => set(["dashboard", "css"], e.target.value)}
                  rows={10}
                  spellCheck={false}
                  placeholder={`.cms-dash aside { border-right: 1px solid #e5e7eb; }\n.cms-dash h1 { letter-spacing: -0.02em; }`}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm font-mono outline-none focus:ring-2 focus:ring-blue-500"
                />
              </SubSection>
            </Section>
          ) : null}

          {tab === "auth" ? (
            <Section title="Auth pages appearance" desc="Style the Login, Forgot Password, Verification (OTP) and Reset Password pages — background, card, inputs, buttons and layout. Leave anything blank to keep the built-in look.">
              <SubSection title="Page background">
                <F label="Background type">
                  <SelectInput
                    value={s.auth?.style?.bgType || ""}
                    onChange={(v) => set(["auth", "style", "bgType"], v)}
                    options={[{ value: "", label: "default" }, { value: "solid", label: "solid color" }, { value: "gradient", label: "gradient" }, { value: "image", label: "image" }]}
                  />
                </F>
                {s.auth?.style?.bgType === "solid" ? (
                  <F label="Background color"><ColorInput value={s.auth?.style?.bgColor} onChange={(v) => set(["auth", "style", "bgColor"], v)} /></F>
                ) : null}
                {s.auth?.style?.bgType === "gradient" ? (
                  <Grid2>
                    <F label="Gradient from"><ColorInput value={s.auth?.style?.gradFrom} onChange={(v) => set(["auth", "style", "gradFrom"], v)} /></F>
                    <F label="Gradient to"><ColorInput value={s.auth?.style?.gradTo} onChange={(v) => set(["auth", "style", "gradTo"], v)} /></F>
                    <F label="Angle (deg)"><TextInput value={s.auth?.style?.gradAngle} onChange={(v) => set(["auth", "style", "gradAngle"], v)} placeholder="135" /></F>
                  </Grid2>
                ) : null}
                {s.auth?.style?.bgType === "image" ? (
                  <>
                    <F label="Background image"><ImagePicker value={s.auth?.style?.bgImage} onChange={(v) => set(["auth", "style", "bgImage"], v)} /></F>
                    <F label="Dark overlay (0–100)"><TextInput value={s.auth?.style?.bgOverlay} onChange={(v) => set(["auth", "style", "bgOverlay"], v)} placeholder="e.g. 40" /></F>
                  </>
                ) : null}
              </SubSection>

              <SubSection title="Card">
                <Grid2>
                  <F label="Card background"><ColorInput value={s.auth?.style?.cardBg} onChange={(v) => set(["auth", "style", "cardBg"], v)} /></F>
                  <F label="Card text color"><ColorInput value={s.auth?.style?.cardText} onChange={(v) => set(["auth", "style", "cardText"], v)} /></F>
                  <F label="Border color"><ColorInput value={s.auth?.style?.cardBorderColor} onChange={(v) => set(["auth", "style", "cardBorderColor"], v)} /></F>
                  <F label="Corner radius (px)"><TextInput value={s.auth?.style?.cardRadius} onChange={(v) => set(["auth", "style", "cardRadius"], v)} placeholder="e.g. 24" /></F>
                  <F label="Max width (px)"><TextInput value={s.auth?.style?.cardMaxWidth} onChange={(v) => set(["auth", "style", "cardMaxWidth"], v)} placeholder="e.g. 440" /></F>
                  <F label="Shadow"><SelectInput value={s.auth?.style?.cardShadow || ""} onChange={(v) => set(["auth", "style", "cardShadow"], v)} options={[{ value: "", label: "default" }, "none", "sm", "md", "lg", "xl"]} /></F>
                  <F label="Card position"><SelectInput value={s.auth?.style?.cardAlign || ""} onChange={(v) => set(["auth", "style", "cardAlign"], v)} options={[{ value: "", label: "default" }, { value: "left", label: "left" }, { value: "center", label: "center" }, { value: "right", label: "right" }]} /></F>
                </Grid2>
              </SubSection>

              <SubSection title="Text">
                <Grid2>
                  <F label="Heading color"><ColorInput value={s.auth?.style?.titleColor} onChange={(v) => set(["auth", "style", "titleColor"], v)} /></F>
                  <F label="Subtitle / helper color"><ColorInput value={s.auth?.style?.subtitleColor} onChange={(v) => set(["auth", "style", "subtitleColor"], v)} /></F>
                </Grid2>
              </SubSection>

              <SubSection title="Buttons & links">
                <Grid2>
                  <F label="Button color"><ColorInput value={s.auth?.style?.accent} onChange={(v) => set(["auth", "style", "accent"], v)} /></F>
                  <F label="Button hover color"><ColorInput value={s.auth?.style?.accentHover} onChange={(v) => set(["auth", "style", "accentHover"], v)} /></F>
                  <F label="Button text color"><ColorInput value={s.auth?.style?.buttonText} onChange={(v) => set(["auth", "style", "buttonText"], v)} /></F>
                  <F label="Link color"><ColorInput value={s.auth?.style?.linkColor} onChange={(v) => set(["auth", "style", "linkColor"], v)} /></F>
                </Grid2>
              </SubSection>

              <SubSection title="Inputs">
                <Grid2>
                  <F label="Input background"><ColorInput value={s.auth?.style?.inputBg} onChange={(v) => set(["auth", "style", "inputBg"], v)} /></F>
                  <F label="Input border"><ColorInput value={s.auth?.style?.inputBorder} onChange={(v) => set(["auth", "style", "inputBorder"], v)} /></F>
                  <F label="Input text"><ColorInput value={s.auth?.style?.inputText} onChange={(v) => set(["auth", "style", "inputText"], v)} /></F>
                  <F label="Focus color"><ColorInput value={s.auth?.style?.inputFocus} onChange={(v) => set(["auth", "style", "inputFocus"], v)} /></F>
                </Grid2>
              </SubSection>

              <SubSection title="Login image (login page only)" desc="The photo shown beside the login form.">
                <F label="Image (overrides the default)"><ImagePicker value={s.auth?.style?.loginImage} onChange={(v) => set(["auth", "style", "loginImage"], v)} /></F>
                <Grid2>
                  <F label="Image width (%)"><TextInput value={s.auth?.style?.loginImageWidth} onChange={(v) => set(["auth", "style", "loginImageWidth"], v)} placeholder="e.g. 60" /></F>
                  <F label="Hide image"><Toggle value={!!s.auth?.style?.hideLoginImage} onChange={(v) => set(["auth", "style", "hideLoginImage"], v)} label="Hide image → centered card" /></F>
                </Grid2>
              </SubSection>

              <SubSection title="Custom auth CSS (advanced)" desc="Full control — target elements with a .cms-auth prefix, e.g. .cms-auth-card { ... }.">
                <textarea
                  value={s.auth?.css || ""}
                  onChange={(e) => set(["auth", "css"], e.target.value)}
                  rows={8}
                  spellCheck={false}
                  placeholder={`.cms-auth-card { backdrop-filter: blur(6px); }\n.cms-auth-title { letter-spacing: -0.02em; }`}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm font-mono outline-none focus:ring-2 focus:ring-blue-500"
                />
              </SubSection>
            </Section>
          ) : null}

          {tab === "maintenance" ? (
            <Section title="Maintenance mode" desc="When ON, every visitor except you (the owner) sees the maintenance screen on all pages — only the login page stays reachable. You always see the live site. You can also flip this from the bar at the top of the header.">
              <F label="Maintenance mode">
                <Toggle value={!!s.maintenance?.enabled} onChange={(v) => set(["maintenance", "enabled"], v)} label={s.maintenance?.enabled ? "ON — site hidden from visitors" : "OFF — site is live"} />
              </F>
              <F label="Heading"><TextInput value={s.maintenance?.title} onChange={(v) => set(["maintenance", "title"], v)} placeholder="We'll be back soon" /></F>
              <F label="Message shown to visitors"><TextArea value={s.maintenance?.message} onChange={(v) => set(["maintenance", "message"], v)} rows={4} /></F>
              <p className="text-xs text-gray-400">Tip: after editing the text here, click <b>Save</b>. To quickly turn maintenance on/off without opening this page, use the toggle in the header bar.</p>
            </Section>
          ) : null}

          {tab === "social" ? (
            <Section title="Social links" desc="Optional social profile URLs.">
              <Grid2>
                <F label="Facebook"><TextInput value={s.social?.facebook} onChange={(v) => set(["social", "facebook"], v)} /></F>
                <F label="Twitter / X"><TextInput value={s.social?.twitter} onChange={(v) => set(["social", "twitter"], v)} /></F>
                <F label="LinkedIn"><TextInput value={s.social?.linkedin} onChange={(v) => set(["social", "linkedin"], v)} /></F>
                <F label="Instagram"><TextInput value={s.social?.instagram} onChange={(v) => set(["social", "instagram"], v)} /></F>
                <F label="YouTube"><TextInput value={s.social?.youtube} onChange={(v) => set(["social", "youtube"], v)} /></F>
              </Grid2>
            </Section>
          ) : null}

          {tab === "css" ? (
            <Section title="Global custom CSS" desc="Injected on every page. Use for site-wide tweaks.">
              <textarea
                value={customCss}
                onChange={(e) => setCustomCss(e.target.value)}
                rows={14}
                spellCheck={false}
                placeholder={`:root { --brand: #2563eb; }\nheader { box-shadow: 0 2px 8px rgba(0,0,0,.05); }`}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm font-mono outline-none focus:ring-2 focus:ring-blue-500"
              />
            </Section>
          ) : null}
        </div>
      </div>
    </div>
  );
}

/* ---- small layout helpers ---- */
function Section({ title, desc, children }) {
  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
        {desc ? <p className="text-sm text-gray-500">{desc}</p> : null}
      </div>
      {children}
    </div>
  );
}
function SubSection({ title, desc, children }) {
  return (
    <div className="mt-6 pt-5 border-t border-gray-100 space-y-4">
      <div>
        <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-1.5">
          <Palette size={14} className="text-blue-500" /> {title}
        </h3>
        {desc ? <p className="text-xs text-gray-500 mt-0.5">{desc}</p> : null}
      </div>
      {children}
    </div>
  );
}
function F({ label, children }) {
  return (
    <div>
      <Label>{label}</Label>
      {children}
    </div>
  );
}
function Grid2({ children }) {
  return <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">{children}</div>;
}

function FooterColumns({ columns, onChange }) {
  const update = (i, next) => onChange(columns.map((c, idx) => (idx === i ? next : c)));
  const add = () => onChange([...columns, { title: "New Column", links: [] }]);
  const remove = (i) => onChange(columns.filter((_, idx) => idx !== i));
  return (
    <div>
      <Label>Link columns</Label>
      <div className="space-y-3">
        {columns.map((col, i) => (
          <div key={i} className="rounded-lg border border-gray-200 bg-gray-50 p-3">
            <div className="flex items-center gap-2 mb-2">
              <TextInput value={col.title} onChange={(v) => update(i, { ...col, title: v })} placeholder="Column title" />
              <button onClick={() => remove(i)} className="shrink-0 px-2.5 py-2 rounded-lg text-xs text-red-600 hover:bg-red-100">
                Remove
              </button>
            </div>
            <ListEditor
              field={{
                itemLabel: "Link",
                itemFields: [
                  { key: "name", type: "text", label: "Label" },
                  { key: "href", type: "text", label: "URL" },
                ],
              }}
              value={col.links}
              onChange={(v) => update(i, { ...col, links: v })}
            />
          </div>
        ))}
        <button
          onClick={add}
          className="w-full inline-flex items-center justify-center gap-1.5 py-2 rounded-lg border-2 border-dashed border-gray-300 text-sm text-gray-500 hover:border-blue-400 hover:text-blue-600"
        >
          + Add column
        </button>
      </div>
    </div>
  );
}
