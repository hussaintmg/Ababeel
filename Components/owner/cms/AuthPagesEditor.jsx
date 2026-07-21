"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import axios from "axios";
import { toast } from "react-toastify";
import { ArrowLeft, ExternalLink, KeyRound, Loader2, RotateCcw, Save } from "lucide-react";
import {
  ColorInput,
  ImagePicker,
  Label,
  SelectInput,
  TextArea,
  TextInput,
  Toggle,
} from "@/Components/owner/cms/fields";
import { useSiteContent } from "@/context/SiteContentContext";

const PAGES = [
  { id: "login", label: "Login", route: "/login" },
  { id: "forgot", label: "Forgot Password", route: "/forgot-password" },
  { id: "otp", label: "OTP Popup", route: "/forgot-password" },
  { id: "reset", label: "Reset Password", route: "/login" },
];

const EMPTY_PAGE = { style: {}, css: "" };

function setIn(object, path, value) {
  if (!path.length) return value;
  const [head, ...tail] = path;
  return { ...(object || {}), [head]: setIn(object?.[head], tail, value) };
}

export default function AuthPagesEditor() {
  const [auth, setAuth] = useState(null);
  const [active, setActive] = useState("login");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { refresh } = useSiteContent();

  useEffect(() => {
    axios.get("/api/owner/auth-pages", { withCredentials: true })
      .then((res) => setAuth(res.data?.auth || { pages: {} }))
      .catch(() => toast.error("Could not load authentication page settings"))
      .finally(() => setLoading(false));
  }, []);

  const page = auth?.pages?.[active] || EMPTY_PAGE;
  const style = page.style || {};
  const setStyle = (key, value) => setAuth((prev) => setIn(prev, ["pages", active, "style", key], value));
  const setCss = (value) => setAuth((prev) => setIn(prev, ["pages", active, "css"], value));

  const save = async () => {
    setSaving(true);
    try {
      await axios.put("/api/owner/auth-pages", { auth }, { withCredentials: true });
      await refresh?.();
      toast.success("Authentication page designs saved");
    } catch (error) {
      toast.error(error?.response?.data?.error || "Save failed");
    } finally {
      setSaving(false);
    }
  };

  const resetPage = () => {
    if (!window.confirm(`Reset the ${PAGES.find((p) => p.id === active)?.label} design overrides?`)) return;
    setAuth((prev) => setIn(prev, ["pages", active], { style: {}, css: "" }));
  };

  if (loading || !auth) {
    return <div className="flex items-center justify-center py-24 text-gray-500"><Loader2 className="animate-spin mr-2" /> Loading editor...</div>;
  }

  const current = PAGES.find((item) => item.id === active);

  return (
    <div className="pb-24">
      <div className="sticky top-16 md:top-20 z-20 -mx-4 md:-mx-6 px-4 md:px-6 py-3 bg-white/95 backdrop-blur border-b border-gray-200 flex items-center gap-3">
        <Link href="/owner/cms" className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-800"><ArrowLeft size={16} /> All Pages</Link>
        <div className="h-5 w-px bg-gray-200" />
        <KeyRound size={18} className="text-indigo-600" />
        <h1 className="font-semibold text-gray-900">Authentication Pages</h1>
        <a href={current.route} target="_blank" className="ml-auto hidden sm:inline-flex items-center gap-1 text-sm text-gray-500 hover:text-indigo-600"><ExternalLink size={14} /> Preview</a>
        <button onClick={save} disabled={saving} className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-60">
          {saving ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />} Save all
        </button>
      </div>

      <div className="mt-6 flex gap-2 overflow-x-auto pb-2">
        {PAGES.map((item) => (
          <button key={item.id} onClick={() => setActive(item.id)} className={`px-4 py-2.5 rounded-xl text-sm font-medium whitespace-nowrap border transition-colors ${active === item.id ? "bg-indigo-600 border-indigo-600 text-white" : "bg-white border-gray-200 text-gray-600 hover:border-indigo-300"}`}>
            {item.label}
          </button>
        ))}
      </div>

      <div className="mt-4 max-w-4xl rounded-2xl border border-gray-200 bg-white p-5 md:p-6 space-y-7">
        <div className="flex items-start justify-between gap-4">
          <div><h2 className="text-lg font-semibold text-gray-900">{current.label} design</h2><p className="text-sm text-gray-500">These settings apply only to this page and override shared auth styling.</p></div>
          <button onClick={resetPage} className="inline-flex items-center gap-1 text-xs text-gray-500 hover:text-red-600"><RotateCcw size={14} /> Reset page</button>
        </div>

        <Section title="Page background">
          <Grid>
            <Field label="Background type"><SelectInput value={style.bgType || ""} onChange={(v) => setStyle("bgType", v)} options={[{ value: "", label: "Default" }, "solid", "gradient", "image"]} /></Field>
            <Field label="Content horizontal alignment"><SelectInput value={style.cardAlign || ""} onChange={(v) => setStyle("cardAlign", v)} options={[{ value: "", label: "Default" }, "left", "center", "right"]} /></Field>
            <Field label="Content vertical alignment"><SelectInput value={style.verticalAlign || ""} onChange={(v) => setStyle("verticalAlign", v)} options={[{ value: "", label: "Default" }, "top", "center", "bottom"]} /></Field>
            <Field label="Page padding (px)"><TextInput value={style.pagePadding} onChange={(v) => setStyle("pagePadding", v)} placeholder="e.g. 24" /></Field>
          </Grid>
          {style.bgType === "solid" ? <Field label="Background color"><ColorInput value={style.bgColor} onChange={(v) => setStyle("bgColor", v)} /></Field> : null}
          {style.bgType === "gradient" ? <Grid><Field label="Gradient from"><ColorInput value={style.gradFrom} onChange={(v) => setStyle("gradFrom", v)} /></Field><Field label="Gradient to"><ColorInput value={style.gradTo} onChange={(v) => setStyle("gradTo", v)} /></Field><Field label="Angle"><TextInput value={style.gradAngle} onChange={(v) => setStyle("gradAngle", v)} placeholder="135" /></Field></Grid> : null}
          {style.bgType === "image" ? <><Field label="Background image"><ImagePicker value={style.bgImage} onChange={(v) => setStyle("bgImage", v)} /></Field><Field label="Dark overlay (0-100)"><TextInput value={style.bgOverlay} onChange={(v) => setStyle("bgOverlay", v)} placeholder="40" /></Field></> : null}
        </Section>

        {active === "login" ? (
          <Section title="Login split layout">
            <Field label="Side image"><ImagePicker value={style.loginImage} onChange={(v) => setStyle("loginImage", v)} /></Field>
            <Grid><Field label="Image column width (%)"><TextInput value={style.loginImageWidth} onChange={(v) => setStyle("loginImageWidth", v)} placeholder="60" /></Field><Field label="Image visibility"><Toggle value={!!style.hideLoginImage} onChange={(v) => setStyle("hideLoginImage", v)} label="Hide side image" /></Field></Grid>
          </Section>
        ) : null}

        <Section title={active === "otp" ? "OTP popup card" : "Form card"}>
          <Grid>
            <Field label="Card width (px)"><TextInput value={style.cardMaxWidth} onChange={(v) => setStyle("cardMaxWidth", v)} placeholder="440" /></Field>
            <Field label="Inner padding (px)"><TextInput value={style.cardPadding} onChange={(v) => setStyle("cardPadding", v)} placeholder="32" /></Field>
            <Field label="Corner radius (px)"><TextInput value={style.cardRadius} onChange={(v) => setStyle("cardRadius", v)} placeholder="24" /></Field>
            <Field label="Shadow"><SelectInput value={style.cardShadow || ""} onChange={(v) => setStyle("cardShadow", v)} options={[{ value: "", label: "Default" }, "none", "sm", "md", "lg", "xl"]} /></Field>
            <Field label="Card background"><ColorInput value={style.cardBg} onChange={(v) => setStyle("cardBg", v)} /></Field>
            <Field label="Border color"><ColorInput value={style.cardBorderColor} onChange={(v) => setStyle("cardBorderColor", v)} /></Field>
          </Grid>
        </Section>

        <Section title="Text, inputs and actions">
          <Grid>
            <Field label="Heading color"><ColorInput value={style.titleColor} onChange={(v) => setStyle("titleColor", v)} /></Field>
            <Field label="Helper text color"><ColorInput value={style.subtitleColor} onChange={(v) => setStyle("subtitleColor", v)} /></Field>
            <Field label="Input background"><ColorInput value={style.inputBg} onChange={(v) => setStyle("inputBg", v)} /></Field>
            <Field label="Input border"><ColorInput value={style.inputBorder} onChange={(v) => setStyle("inputBorder", v)} /></Field>
            <Field label="Input text"><ColorInput value={style.inputText} onChange={(v) => setStyle("inputText", v)} /></Field>
            <Field label="Input focus"><ColorInput value={style.inputFocus} onChange={(v) => setStyle("inputFocus", v)} /></Field>
            <Field label="Primary button"><ColorInput value={style.accent} onChange={(v) => setStyle("accent", v)} /></Field>
            <Field label="Button hover"><ColorInput value={style.accentHover} onChange={(v) => setStyle("accentHover", v)} /></Field>
            <Field label="Button text"><ColorInput value={style.buttonText} onChange={(v) => setStyle("buttonText", v)} /></Field>
            <Field label="Link color"><ColorInput value={style.linkColor} onChange={(v) => setStyle("linkColor", v)} /></Field>
          </Grid>
        </Section>

        <Section title="Custom CSS" description={`Scoped to the ${current.label} page. Use .cms-auth, .cms-auth-card, .cms-auth-input and .cms-auth-btn.`}>
          <TextArea value={page.css || ""} onChange={setCss} rows={10} placeholder={`.cms-auth-card { backdrop-filter: blur(10px); }`} />
        </Section>
      </div>
    </div>
  );
}

function Section({ title, description, children }) {
  return <section className="pt-6 first:pt-0 border-t first:border-t-0 border-gray-100 space-y-4"><div><h3 className="font-semibold text-gray-900">{title}</h3>{description ? <p className="text-xs text-gray-500 mt-0.5">{description}</p> : null}</div>{children}</section>;
}
function Grid({ children }) { return <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">{children}</div>; }
function Field({ label, children }) { return <div><Label>{label}</Label>{children}</div>; }
