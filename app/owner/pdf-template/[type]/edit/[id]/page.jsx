"use client";

import { useState, useEffect, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { useTemplate, createDefaultPage } from "@/context/TemplateContext";
import {
  getSampleData,
  getPlaceholderFields,
} from "@/constants/Templateplaceholders";
import { AVAILABLE_FONTS, loadCustomFonts } from "@/constants/fonts";
import QRCode from "qrcode";

// ─────────────────────────────────────────────────────────────────────────────
// CONSTANTS
// ─────────────────────────────────────────────────────────────────────────────

const PAGE_FORMATS = {
  A4: { width: 794, height: 1123, label: "A4 (210×297mm)" },
  A3: { width: 1123, height: 1587, label: "A3 (297×420mm)" },
  A5: { width: 559, height: 794, label: "A5 (148×210mm)" },
  LETTER: { width: 816, height: 1056, label: "Letter (216×279mm)" },
  LEGAL: { width: 816, height: 1344, label: "Legal (216×356mm)" },
  CUSTOM: { width: 800, height: 600, label: "Custom Size" },
};

const CONDITION_OPERATORS = [">", ">=", "<", "<=", "==", "!="];

const CSS_PROPERTIES = [
  "font-size",
  "font-weight",
  "font-family",
  "color",
  "background-color",
  "top",
  "left",
  "right",
  "bottom",
  "width",
  "height",
  "opacity",
  "text-align",
  "vertical-align",
  "letter-spacing",
  "line-height",
  "border",
  "border-radius",
  "padding",
  "margin",
  "z-index",
];

const TEXT_ALIGN_OPTIONS = [
  { value: "left", label: "Left" },
  { value: "center", label: "Center" },
  { value: "right", label: "Right" },
  { value: "justify", label: "Justify" },
];

const VERTICAL_ALIGN_OPTIONS = [
  { value: "top", label: "Top" },
  { value: "middle", label: "Middle" },
  { value: "bottom", label: "Bottom" },
];

const UNITS = ["px", "cm", "mm", "in", "pt", "%"];

// ─────────────────────────────────────────────────────────────────────────────
// UTILS
// ─────────────────────────────────────────────────────────────────────────────

function uid() {
  return Math.random().toString(36).slice(2, 9);
}

function getPageDimensions(config) {
  if (config.format === "CUSTOM") {
    return {
      width: config.customWidth || 800,
      height: config.customHeight || 600,
    };
  }
  const base = PAGE_FORMATS[config.format] || PAGE_FORMATS.A4;
  return { width: base.width, height: base.height };
}

function parseValueWithUnit(value) {
  if (!value) return { num: 0, unit: "px" };
  const match = value.match(/^([\d.-]+)([a-z%]*)$/i);
  if (match) {
    return { num: parseFloat(match[1]), unit: match[2] || "px" };
  }
  return { num: parseFloat(value) || 0, unit: "px" };
}

function formatValueWithUnit(num, unit = "px") {
  return `${num}${unit}`;
}

function convertLeftToRight(leftVal, elWidthVal, pageWidth) {
  const { num: left, unit } = parseValueWithUnit(leftVal);
  const { num: elWidth } = parseValueWithUnit(elWidthVal);
  const right = pageWidth - left - elWidth;
  return formatValueWithUnit(Math.round(right), unit);
}

function convertRightToLeft(rightVal, elWidthVal, pageWidth) {
  const { num: right, unit } = parseValueWithUnit(rightVal);
  const { num: elWidth } = parseValueWithUnit(elWidthVal);
  const left = pageWidth - right - elWidth;
  return formatValueWithUnit(Math.round(left), unit);
}

function convertTopToBottom(topVal, elHeightVal, pageHeight) {
  const { num: top, unit } = parseValueWithUnit(topVal);
  const { num: elHeight } = parseValueWithUnit(elHeightVal);
  const bottom = pageHeight - top - elHeight;
  return formatValueWithUnit(Math.round(bottom), unit);
}

function convertBottomToTop(bottomVal, elHeightVal, pageHeight) {
  const { num: bottom, unit } = parseValueWithUnit(bottomVal);
  const { num: elHeight } = parseValueWithUnit(elHeightVal);
  const top = pageHeight - bottom - elHeight;
  return formatValueWithUnit(Math.round(top), unit);
}

function resolvePlaceholders(text, data) {
  if (!text) return "";
  return text.replace(/\{\{([^}]+)\}\}/g, (_, path) => {
    const parts = path.trim().split(".");
    let val = data;
    for (const p of parts) {
      val = val?.[p];
      if (val === undefined) return `{{${path}}}`;
    }
    return String(val);
  });
}

function formatTextWithLineBreak(text, maxWordsPerLine = 3) {
  if (!text) return { firstLine: "", secondLine: "" };
  const words = text.trim().split(/\s+/);
  if (words.length <= maxWordsPerLine) {
    return { firstLine: text, secondLine: "" };
  }
  const splitIndex = Math.ceil(words.length * 0.6);
  const firstLine = words.slice(0, splitIndex).join(" ");
  const secondLine = words.slice(splitIndex).join(" ");
  return { firstLine, secondLine };
}

// ─────────────────────────────────────────────────────────────────────────────
// COMPONENTS
// ─────────────────────────────────────────────────────────────────────────────

function Btn({
  children,
  onClick,
  variant = "primary",
  size = "sm",
  disabled = false,
  className = "",
}) {
  const base =
    "inline-flex items-center gap-1.5 font-medium rounded-lg transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed";
  const sizes = {
    xs: "px-2 py-1 text-xs",
    sm: "px-3 py-1.5 text-sm",
    md: "px-4 py-2 text-sm",
    lg: "px-5 py-2.5 text-base",
  };
  const variants = {
    primary: "bg-indigo-600 text-white hover:bg-indigo-700 shadow-sm",
    secondary: "bg-white text-gray-700 border border-gray-300 hover:bg-gray-50",
    danger: "bg-red-600 text-white hover:bg-red-700",
    ghost: "text-gray-600 hover:bg-gray-100",
    success: "bg-emerald-600 text-white hover:bg-emerald-700",
  };
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`${base} ${sizes[size]} ${variants[variant]} ${className}`}
    >
      {children}
    </button>
  );
}

function Badge({ children, color = "blue" }) {
  const colors = {
    blue: "bg-blue-100 text-blue-700",
    green: "bg-green-100 text-green-700",
    red: "bg-red-100 text-red-700",
    gray: "bg-gray-100 text-gray-600",
  };
  return (
    <span
      className={`text-xs px-2 py-0.5 rounded-full font-medium ${colors[color]}`}
    >
      {children}
    </span>
  );
}

function CustomModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = "Yes",
  cancelText = "Cancel",
}) {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative bg-white rounded-2xl shadow-2xl max-w-md w-full p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">{title}</h3>
        <p className="text-sm text-gray-600 mb-6">{message}</p>
        <div className="flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition"
          >
            {cancelText}
          </button>
          <button
            onClick={onConfirm}
            className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 transition"
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}

function DraftModal({ isOpen, onClose, onLoad, onDiscard, draftDate }) {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative bg-white rounded-2xl shadow-2xl max-w-md w-full p-6">
        <div className="text-center mb-4">
          <div className="text-4xl mb-2">💾</div>
          <h3 className="text-lg font-semibold text-gray-900">
            Unsaved Draft Found
          </h3>
          <p className="text-sm text-gray-500 mt-1">
            You have an unsaved draft from
            <br />
            <span className="font-medium text-gray-700">{draftDate}</span>
          </p>
        </div>
        <p className="text-xs text-gray-400 text-center mb-6">
          Would you like to load the draft or discard it?
        </p>
        <div className="flex gap-3">
          <button
            onClick={onDiscard}
            className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition"
          >
            Discard Draft
          </button>
          <button
            onClick={onLoad}
            className="flex-1 px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition"
          >
            Load Draft
          </button>
        </div>
      </div>
    </div>
  );
}

function QREditorModal({ open, onSave, onClose }) {
  const [qrStyles, setQRStyles] = useState({
    width: "100px",
    height: "100px",
    top: "100px",
    left: "100px",
    border: "none",
    borderRadius: "0px",
  });

  if (!open) return null;

  function updateStyle(property, value) {
    setQRStyles((prev) => ({ ...prev, [property]: value }));
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
        <h3 className="font-semibold text-gray-800 mb-4">Add QR Code</h3>
        <div className="space-y-4">
          <div>
            <label className="text-xs font-medium text-gray-500 block mb-1">
              Width
            </label>
            <input
              type="text"
              value={qrStyles.width}
              onChange={(e) => updateStyle("width", e.target.value)}
              placeholder="100px"
              className="w-full px-3 py-2 text-sm border rounded-lg"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-gray-500 block mb-1">
              Height
            </label>
            <input
              type="text"
              value={qrStyles.height}
              onChange={(e) => updateStyle("height", e.target.value)}
              placeholder="100px"
              className="w-full px-3 py-2 text-sm border rounded-lg"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-gray-500 block mb-1">
              Top Position
            </label>
            <input
              type="text"
              value={qrStyles.top}
              onChange={(e) => updateStyle("top", e.target.value)}
              placeholder="100px"
              className="w-full px-3 py-2 text-sm border rounded-lg"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-gray-500 block mb-1">
              Left Position
            </label>
            <input
              type="text"
              value={qrStyles.left}
              onChange={(e) => updateStyle("left", e.target.value)}
              placeholder="100px"
              className="w-full px-3 py-2 text-sm border rounded-lg"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-gray-500 block mb-1">
              Border
            </label>
            <input
              type="text"
              value={qrStyles.border}
              onChange={(e) => updateStyle("border", e.target.value)}
              placeholder="1px solid #000"
              className="w-full px-3 py-2 text-sm border rounded-lg"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-gray-500 block mb-1">
              Border Radius
            </label>
            <input
              type="text"
              value={qrStyles.borderRadius}
              onChange={(e) => updateStyle("borderRadius", e.target.value)}
              placeholder="8px"
              className="w-full px-3 py-2 text-sm border rounded-lg"
            />
          </div>
        </div>
        <div className="flex justify-end gap-2 mt-6">
          <Btn variant="secondary" onClick={onClose}>
            Cancel
          </Btn>
          <Btn variant="primary" onClick={() => onSave(qrStyles)}>
            Add QR Code
          </Btn>
        </div>
      </div>
    </div>
  );
}

function PageConfigPanel({
  config,
  backgroundImage,
  bgSize,
  bgPosition,
  onChange,
  onBgChange,
  onBgSizeChange,
  onBgPositionChange,
}) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4 space-y-4 shadow-sm">
      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
        Page Configuration
      </p>
      <div className="grid grid-cols-1 gap-3">
        <select
          value={config.format}
          onChange={(e) => onChange({ ...config, format: e.target.value })}
          className="px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-400 bg-white"
        >
          {Object.entries(PAGE_FORMATS).map(([key, val]) => (
            <option key={key} value={key}>
              {val.label}
            </option>
          ))}
        </select>
      </div>

      {config.format === "CUSTOM" && (
        <div className="grid grid-cols-1 gap-3">
          <div>
            <label className="text-xs text-gray-500 block mb-1">Width</label>
            <div className="flex gap-1">
              <input
                type="number"
                value={config.customWidth || 800}
                onChange={(e) =>
                  onChange({
                    ...config,
                    customWidth: parseFloat(e.target.value) || 800,
                  })
                }
                className="flex-1 px-3 py-2 text-sm border border-gray-200 rounded-lg"
              />
              <select
                value={config.widthUnit || "px"}
                onChange={(e) =>
                  onChange({ ...config, widthUnit: e.target.value })
                }
                className="w-20 px-2 py-2 text-sm border border-gray-200 rounded-lg"
              >
                {UNITS.map((u) => (
                  <option key={u} value={u}>
                    {u}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div>
            <label className="text-xs text-gray-500 block mb-1">Height</label>
            <div className="flex gap-1">
              <input
                type="number"
                value={config.customHeight || 600}
                onChange={(e) =>
                  onChange({
                    ...config,
                    customHeight: parseFloat(e.target.value) || 600,
                  })
                }
                className="flex-1 px-3 py-2 text-sm border border-gray-200 rounded-lg"
              />
              <select
                value={config.heightUnit || "px"}
                onChange={(e) =>
                  onChange({ ...config, heightUnit: e.target.value })
                }
                className="w-20 px-2 py-2 text-sm border border-gray-200 rounded-lg"
              >
                {UNITS.map((u) => (
                  <option key={u} value={u}>
                    {u}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      )}

      <div>
        <label className="text-xs font-medium text-gray-500 uppercase tracking-wide block mb-2">
          Background Image
        </label>
        <div className="flex gap-2 items-center flex-wrap">
          <label className="cursor-pointer px-3 py-2 text-sm bg-white border border-gray-200 rounded-lg hover:bg-gray-50 font-medium text-gray-600">
            Choose Image
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) {
                  const reader = new FileReader();
                  reader.onload = (ev) => onBgChange(ev.target.result);
                  reader.readAsDataURL(file);
                }
              }}
            />
          </label>
          <input
            type="text"
            value={backgroundImage || ""}
            onChange={(e) => onBgChange(e.target.value)}
            placeholder="Image URL or {{field}}"
            className="flex-1 px-3 py-2 text-sm border border-gray-200 rounded-lg"
          />
          {backgroundImage && (
            <Btn size="xs" variant="danger" onClick={() => onBgChange(null)}>
              Remove
            </Btn>
          )}
        </div>
      </div>
    </div>
  );
}

function ElementEditorModal({
  open,
  element,
  onSave,
  onClose,
  placeholderFields,
}) {
  const [local, setLocal] = useState(null);
  const [showPlaceholders, setShowPlaceholders] = useState(false);
  const [showCustomCss, setShowCustomCss] = useState(false);
  const [customCssProperty, setCustomCssProperty] = useState("");
  const [customCssValue, setCustomCssValue] = useState("");
  const [imageSourceType, setImageSourceType] = useState("url"); // "url", "upload", "user", "candidate"
  const textRef = useRef(null);

  useEffect(() => {
    if (!element) return;

    setLocal((prev) => {
      if (prev?.id === element.id) {
        // Merge parent's coordinate changes (e.g. via drag/resize) into local.css
        const mergedCss = (prev.css || []).map((localProp) => {
          const parentProp = (element.css || []).find(
            (p) => p.property === localProp.property,
          );
          if (parentProp && parentProp.value !== localProp.value) {
            if (
              ["top", "left", "right", "bottom", "width", "height"].includes(localProp.property)
            ) {
              return { ...localProp, value: parentProp.value };
            }
          }
          return localProp;
        });

        // Add any coordinates that are in parent but not in local
        (element.css || []).forEach((parentProp) => {
          if (
            ["top", "left", "right", "bottom", "width", "height"].includes(parentProp.property)
          ) {
            if (!mergedCss.some((p) => p.property === parentProp.property)) {
              mergedCss.push(JSON.parse(JSON.stringify(parentProp)));
            }
          }
        });

        return {
          ...prev,
          css: mergedCss,
        };
      }

      return JSON.parse(JSON.stringify(element));
    });

    if (element.type === "image" && element.imageUrl) {
      if (element.imageUrl === "{{User.profileImage.url}}") {
        setImageSourceType("user");
      } else if (element.imageUrl === "{{Candidate.profile.url}}") {
        setImageSourceType("candidate");
      } else if (element.imageUrl?.startsWith("data:image")) {
        setImageSourceType("upload");
      } else {
        setImageSourceType("url");
      }
    }
  }, [element]);

  if (!local) return null;

  function updateField(field, value) {
    setLocal((prev) => ({ ...prev, [field]: value }));
  }

  function updateCss(index, key, value) {
    setLocal((prev) => {
      const css = [...prev.css];
      css[index] = { ...css[index], [key]: value };
      return { ...prev, css };
    });
  }

  function addCssProp() {
    setLocal((prev) => ({
      ...prev,
      css: [...prev.css, { property: "color", value: "black" }],
    }));
  }

  function removeCssProp(index) {
    setLocal((prev) => ({
      ...prev,
      css: prev.css.filter((_, i) => i !== index),
    }));
  }

  function addCustomCss() {
    if (customCssProperty && customCssValue) {
      const existingIndex = local.css.findIndex(
        (c) => c.property === customCssProperty,
      );

      if (existingIndex >= 0) {
        setLocal((prev) => {
          const css = [...prev.css];
          css[existingIndex] = {
            property: customCssProperty,
            value: customCssValue,
          };
          return { ...prev, css };
        });
      } else {
        setLocal((prev) => ({
          ...prev,
          css: [
            ...prev.css,
            { property: customCssProperty, value: customCssValue },
          ],
        }));
      }
      setCustomCssProperty("");
      setCustomCssValue("");
    }
    setShowCustomCss(false);
  }

  function handleImageSourceChange(type) {
    setImageSourceType(type);
    if (type === "user") {
      updateField("imageUrl", "{{User.profileImage.url}}");
    } else if (type === "candidate") {
      updateField("imageUrl", "{{Candidate.profile.url}}");
    } else if (type === "url") {
      updateField("imageUrl", "");
    } else if (type === "upload") {
      updateField("imageUrl", "");
    }
  }

  function handleImageUpload(e) {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (ev) => {
        updateField("imageUrl", ev.target.result);
        setImageSourceType("upload");
      };
      reader.readAsDataURL(file);
    }
  }

  function updateScriptRule(ruleIndex, cssIndex, field, subField, value) {
    setLocal((prev) => {
      const script = [...(prev.script || [])];
      if (!script[ruleIndex]) return prev;

      if (field === "condition") {
        script[ruleIndex] = {
          ...script[ruleIndex],
          condition: {
            ...script[ruleIndex].condition,
            [subField]: value,
          },
        };
      }

      if (field === "css") {
        const existingCss = Array.isArray(script[ruleIndex].css)
          ? script[ruleIndex].css
          : script[ruleIndex].css
            ? [script[ruleIndex].css]
            : [];

        const css = [...existingCss];

        css[cssIndex] = {
          ...css[cssIndex],
          [subField]: value,
        };

        script[ruleIndex] = {
          ...script[ruleIndex],
          css,
        };
      }

      return {
        ...prev,
        script,
      };
    });
  }

  function addScriptRule() {
    setLocal((prev) => {
      const currentScript = prev.script || [];
      const hasDefault = currentScript.some(
        (r) => !r.condition || !r.condition.condition,
      );

      const newRules = [
        ...currentScript,
        {
          condition: {
            compare1: "",
            condition: ">",
            compare2: "",
          },
          css: [
            {
              property: "",
              value: "",
            },
          ],
        },
      ];

      if (!hasDefault) {
        newRules.push({
          condition: {
            compare1: "",
            condition: "",
            compare2: "",
          },
          css: [
            {
              property: "",
              value: "",
            },
          ],
        });
      }

      return {
        ...prev,
        script: newRules,
      };
    });
  }
  function addCssToRule(ruleIndex) {
    setLocal((prev) => {
      const script = [...prev.script];
      if (!script[ruleIndex]) return prev;

      const existingCss = Array.isArray(script[ruleIndex].css)
        ? script[ruleIndex].css
        : script[ruleIndex].css
          ? [script[ruleIndex].css]
          : [];

      script[ruleIndex] = {
        ...script[ruleIndex],
        css: [
          ...existingCss,
          {
            property: "",
            value: "",
          },
        ],
      };

      return {
        ...prev,
        script,
      };
    });
  }
  function removeCssFromRule(ruleIndex, cssIndex) {
    setLocal((prev) => {
      const script = [...prev.script];
      if (!script[ruleIndex]) return prev;

      script[ruleIndex] = {
        ...script[ruleIndex],
        css: script[ruleIndex].css.filter((_, i) => i !== cssIndex),
      };

      return {
        ...prev,
        script,
      };
    });
  }

  function removeScriptRule(index) {
    setLocal((prev) => ({
      ...prev,
      script: prev.script.filter((_, i) => i !== index),
    }));
  }

  function insertPlaceholder(ph) {
    const input = textRef.current;
    if (!input) {
      updateField("text", (local.text || "") + ph);
      return;
    }
    const start = input.selectionStart,
      end = input.selectionEnd;
    const newVal = local.text.slice(0, start) + ph + local.text.slice(end);
    updateField("text", newVal);
    setShowPlaceholders(false);
    setTimeout(() => {
      input.focus();
      input.setSelectionRange(start + ph.length, start + ph.length);
    }, 0);
  }

  const isStandardProperty = (property) => {
    return CSS_PROPERTIES.includes(property);
  };

  return (
    <div
      className={`fixed inset-0 z-5000 flex items-center justify-center p-4 ${open ? "visible" : "invisible"}`}
      style={{ display: open ? "flex" : "none" }}
    >
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h3 className="font-semibold text-gray-800">
            Edit{" "}
            {local.type === "image"
              ? "Image"
              : local.type === "qr"
                ? "QR Code"
                : "Text"}{" "}
            Element
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-2xl leading-none"
          >
            ×
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          {local.type !== "qr" && (
            <div className="flex gap-2">
              {["text", "image"].map((t) => (
                <button
                  key={t}
                  onClick={() => updateField("type", t)}
                  className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${local.type === t ? "bg-indigo-600 text-white" : "bg-gray-100 text-gray-600"}`}
                >
                  {t === "text" ? "📝 Text" : "🖼️ Image"}
                </button>
              ))}
            </div>
          )}

          {local.type === "text" && (
            <div>
              <label className="text-xs font-medium text-gray-500 uppercase tracking-wide block mb-1">
                Content
              </label>
              <textarea
                ref={textRef}
                value={local.text || ""}
                onChange={(e) => updateField("text", e.target.value)}
                rows={3}
                placeholder="Enter text or type {{ for placeholders"
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-400 resize-none"
              />
              <Btn
                size="xs"
                variant="ghost"
                onClick={() => setShowPlaceholders((v) => !v)}
                className="mt-1"
              >
                Insert placeholder
              </Btn>
              {showPlaceholders && (
                <div className="mt-1 bg-white border border-gray-200 rounded-xl shadow-lg p-2 max-h-40 overflow-y-auto">
                  {placeholderFields.map((ph) => (
                    <button
                      key={ph.value}
                      onClick={() => insertPlaceholder(ph.value)}
                      className="w-full text-left px-3 py-1.5 text-xs hover:bg-indigo-50 rounded-lg font-mono"
                    >
                      {ph.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {local.type === "image" && (
            <div>
              <label className="text-xs font-medium text-gray-500 uppercase tracking-wide block mb-2">
                Image Source
              </label>

              {/* Image Source Type Selection */}
              <div className="flex gap-2 mb-3">
                <button
                  onClick={() => handleImageSourceChange("url")}
                  className={`px-3 py-1.5 text-xs rounded-lg transition-colors ${
                    imageSourceType === "url"
                      ? "bg-indigo-600 text-white"
                      : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                  }`}
                >
                  🔗 URL Link
                </button>
                <button
                  onClick={() => handleImageSourceChange("upload")}
                  className={`px-3 py-1.5 text-xs rounded-lg transition-colors ${
                    imageSourceType === "upload"
                      ? "bg-indigo-600 text-white"
                      : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                  }`}
                >
                  📤 Upload Image
                </button>
                <button
                  onClick={() => handleImageSourceChange("user")}
                  className={`px-3 py-1.5 text-xs rounded-lg transition-colors ${
                    imageSourceType === "user"
                      ? "bg-indigo-600 text-white"
                      : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                  }`}
                >
                  👤 User Image
                </button>
                <button
                  onClick={() => handleImageSourceChange("candidate")}
                  className={`px-3 py-1.5 text-xs rounded-lg transition-colors ${
                    imageSourceType === "candidate"
                      ? "bg-indigo-600 text-white"
                      : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                  }`}
                >
                  📋 Candidate Image
                </button>
              </div>

              {/* URL Input */}
              {imageSourceType === "url" && (
                <div>
                  <label className="text-xs text-gray-500 block mb-1">
                    Image URL
                  </label>
                  <input
                    type="text"
                    value={local.imageUrl || ""}
                    onChange={(e) => updateField("imageUrl", e.target.value)}
                    placeholder="https://example.com/image.png"
                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-400"
                  />
                </div>
              )}

              {/* Upload Input */}
              {imageSourceType === "upload" && (
                <div>
                  <label className="cursor-pointer block w-full px-4 py-3 text-sm bg-gray-50 border-2 border-dashed border-gray-300 rounded-lg hover:bg-gray-100 transition-colors text-center">
                    📁 Click to upload image
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleImageUpload}
                    />
                  </label>
                  {local.imageUrl &&
                    local.imageUrl.startsWith("data:image") && (
                      <div className="mt-2">
                        <img
                          src={local.imageUrl}
                          alt="Preview"
                          className="w-20 h-20 object-cover rounded-lg border"
                        />
                      </div>
                    )}
                </div>
              )}

              {/* User Image Info */}
              {imageSourceType === "user" && (
                <div className="p-3 bg-blue-50 rounded-lg">
                  <p className="text-xs text-blue-600">
                    👤 User profile image will be used dynamically
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    Value: {"{{User.profileImage.url}}"}
                  </p>
                </div>
              )}

              {/* Candidate Image Info */}
              {imageSourceType === "candidate" && (
                <div className="p-3 bg-green-50 rounded-lg">
                  <p className="text-xs text-green-600">
                    📋 Candidate profile image will be used dynamically
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    Value: {"{{Candidate.profile.url}}"}
                  </p>
                </div>
              )}
            </div>
          )}

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                CSS Properties
              </label>
              <div className="flex gap-2">
                <Btn size="xs" variant="ghost" onClick={addCssProp}>
                  + Add Property
                </Btn>
                <Btn
                  size="xs"
                  variant="ghost"
                  onClick={() => setShowCustomCss(true)}
                >
                  ✎ Add Custom CSS
                </Btn>
              </div>
            </div>
            <div className="space-y-2">
              {local.css.map((prop, i) => {
                const { num, unit } = parseValueWithUnit(prop.value);
                const isSizeProp = [
                  "top",
                  "left",
                  "right",
                  "bottom",
                  "width",
                  "height",
                  "font-size",
                ].includes(prop.property);
                const isTextAlign = prop.property === "text-align";
                const isVerticalAlign = prop.property === "vertical-align";

                return (
                  <div key={i} className="flex gap-2 items-center">
                    <input
                      type="text"
                      value={prop.property}
                      onChange={(e) => updateCss(i, "property", e.target.value)}
                      placeholder="property name"
                      className="flex-1 px-2 py-1.5 text-xs border border-gray-200 rounded-lg font-mono"
                      list="css-properties-datalist"
                    />

                    {isTextAlign ? (
                      <select
                        value={prop.value}
                        onChange={(e) => updateCss(i, "value", e.target.value)}
                        className="flex-1 px-2 py-1.5 text-xs border border-gray-200 rounded-lg"
                      >
                        {TEXT_ALIGN_OPTIONS.map((opt) => (
                          <option key={opt.value} value={opt.value}>
                            {opt.label}
                          </option>
                        ))}
                      </select>
                    ) : isVerticalAlign ? (
                      <select
                        value={prop.value}
                        onChange={(e) => updateCss(i, "value", e.target.value)}
                        className="flex-1 px-2 py-1.5 text-xs border border-gray-200 rounded-lg"
                      >
                        {VERTICAL_ALIGN_OPTIONS.map((opt) => (
                          <option key={opt.value} value={opt.value}>
                            {opt.label}
                          </option>
                        ))}
                      </select>
                    ) : isSizeProp ? (
                      <>
                        <input
                          type="number"
                          value={num}
                          onChange={(e) => {
                            const newNum = parseFloat(e.target.value) || 0;
                            updateCss(
                              i,
                              "value",
                              formatValueWithUnit(newNum, unit),
                            );
                          }}
                          className="w-24 px-2 py-1.5 text-xs border border-gray-200 rounded-lg"
                        />
                        <select
                          value={unit}
                          onChange={(e) =>
                            updateCss(
                              i,
                              "value",
                              formatValueWithUnit(num, e.target.value),
                            )
                          }
                          className="w-16 px-1 py-1.5 text-xs border border-gray-200 rounded-lg"
                        >
                          {UNITS.map((u) => (
                            <option key={u} value={u}>
                              {u}
                            </option>
                          ))}
                        </select>
                      </>
                    ) : prop.property === "font-family" ? (
                      <select
                        value={prop.value}
                        onChange={(e) => updateCss(i, "value", e.target.value)}
                        className="flex-1 px-2 py-1.5 text-xs border border-gray-200 rounded-lg"
                      >
                        {AVAILABLE_FONTS.map((f) => (
                          <option key={f.id} value={f.value}>
                            {f.family}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <input
                        type="text"
                        value={prop.value}
                        onChange={(e) => updateCss(i, "value", e.target.value)}
                        placeholder="value"
                        className="flex-1 px-2 py-1.5 text-xs border border-gray-200 rounded-lg font-mono"
                      />
                    )}

                    <button
                      onClick={() => removeCssProp(i)}
                      className="text-red-400 hover:text-red-600 text-lg px-2"
                    >
                      ×
                    </button>
                  </div>
                );
              })}
            </div>

            <datalist id="css-properties-datalist">
              {CSS_PROPERTIES.map((prop) => (
                <option key={prop} value={prop} />
              ))}
              <option value="box-shadow" />
              <option value="text-shadow" />
              <option value="background" />
              <option value="background-image" />
              <option value="transition" />
              <option value="animation" />
              <option value="transform" />
              <option value="filter" />
              <option value="backdrop-filter" />
              <option value="clip-path" />
              <option value="object-fit" />
              <option value="object-position" />
              <option value="overflow" />
              <option value="white-space" />
              <option value="word-break" />
              <option value="text-decoration" />
              <option value="text-transform" />
              <option value="letter-spacing" />
              <option value="word-spacing" />
              <option value="line-height" />
              <option value="flex" />
              <option value="grid" />
              <option value="gap" />
            </datalist>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                Conditional Rules
              </label>
              <Btn size="xs" variant="ghost" onClick={addScriptRule}>
                + Add Rule
              </Btn>
            </div>
            <div className="space-y-2">
              {local.script.map((rule, i) => {
                const isDefault = !rule.condition?.condition;

                return (
                  <div
                    key={i}
                    className={`p-3 rounded-xl border ${
                      isDefault
                        ? "border-emerald-200 bg-emerald-50"
                        : "border-gray-200 bg-gray-50"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-medium text-gray-500">
                        {isDefault ? "Default Fallback" : `Rule ${i + 1}`}
                      </span>

                      <button
                        onClick={() => removeScriptRule(i)}
                        className="text-red-400 hover:text-red-600 text-sm"
                      >
                        Remove
                      </button>
                    </div>

                    {!isDefault && (
                      <div className="flex gap-2 items-center mb-3 flex-wrap">
                        <input
                          value={rule.condition.compare1}
                          onChange={(e) =>
                            updateScriptRule(
                              i,
                              null,
                              "condition",
                              "compare1",
                              e.target.value,
                            )
                          }
                          placeholder="{{Field}}"
                          className="flex-1 min-w-[100px] px-2 py-1 text-xs border rounded-lg"
                        />

                        <select
                          value={rule.condition.condition}
                          onChange={(e) =>
                            updateScriptRule(
                              i,
                              null,
                              "condition",
                              "condition",
                              e.target.value,
                            )
                          }
                          className="px-2 py-1 text-xs border rounded-lg"
                        >
                          {CONDITION_OPERATORS.map((op) => (
                            <option key={op} value={op}>
                              {op}
                            </option>
                          ))}
                        </select>

                        <input
                          value={rule.condition.compare2}
                          onChange={(e) =>
                            updateScriptRule(
                              i,
                              null,
                              "condition",
                              "compare2",
                              e.target.value,
                            )
                          }
                          placeholder="value"
                          className="w-24 px-2 py-1 text-xs border rounded-lg"
                        />
                      </div>
                    )}

                    {/* MULTIPLE CSS */}

                    <div className="space-y-2">
                      {(Array.isArray(rule.css)
                        ? rule.css
                        : rule.css
                          ? [rule.css]
                          : []
                      ).map((cssItem, cssIndex) => (
                        <div key={cssIndex} className="flex gap-2 items-center">
                          <input
                            type="text"
                            value={cssItem.property}
                            onChange={(e) =>
                              updateScriptRule(
                                i,
                                cssIndex,
                                "css",
                                "property",
                                e.target.value,
                              )
                            }
                            placeholder="property"
                            className="flex-1 px-2 py-1 text-xs border rounded-lg font-mono"
                          />

                          <input
                            value={cssItem.value}
                            onChange={(e) =>
                              updateScriptRule(
                                i,
                                cssIndex,
                                "css",
                                "value",
                                e.target.value,
                              )
                            }
                            placeholder="value"
                            className="flex-1 px-2 py-1 text-xs border rounded-lg"
                          />

                          <button
                            onClick={() => removeCssFromRule(i, cssIndex)}
                            className="text-red-500 px-2"
                          >
                            ×
                          </button>
                        </div>
                      ))}
                    </div>

                    <button
                      onClick={() => addCssToRule(i)}
                      className="mt-3 px-3 py-1 text-xs bg-indigo-600 text-white rounded-lg"
                    >
                      + Add Another CSS
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-2 px-6 py-4 border-t border-gray-100">
          <Btn variant="secondary" onClick={onClose}>
            Cancel
          </Btn>
          <Btn variant="primary" onClick={() => onSave(local)}>
            Save Element
          </Btn>
        </div>
      </div>

      {showCustomCss && local && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
          <div className="bg-white rounded-2xl max-w-md w-full p-6">
            <h3 className="font-semibold mb-4">Add Custom CSS</h3>
            <div className="space-y-4">
              <div>
                <label className="text-xs font-medium text-gray-500 block mb-1">
                  CSS Property
                </label>
                <input
                  type="text"
                  value={customCssProperty}
                  onChange={(e) => setCustomCssProperty(e.target.value)}
                  onMouseDown={(e) => e.stopPropagation()}
                  onClick={(e) => e.stopPropagation()}
                  placeholder="color, font-size, background, box-shadow, etc."
                  className="w-full px-3 py-2 text-sm border rounded-lg font-mono"
                  list="custom-properties-datalist"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-500 block mb-1">
                  CSS Value
                </label>
                <input
                  type="text"
                  value={customCssValue}
                  onMouseDown={(e) => e.stopPropagation()}
                  onClick={(e) => e.stopPropagation()}
                  onChange={(e) => setCustomCssValue(e.target.value)}
                  placeholder="red, 20px, #000, 10px 10px 5px rgba(0,0,0,0.5), etc."
                  className="w-full px-3 py-2 text-sm border rounded-lg font-mono"
                />
              </div>
              <div className="text-xs text-gray-400">
                Examples: color=red | box-shadow=10px 10px 5px rgba(0,0,0,0.5) |
                text-shadow=2px 2px 4px #000000
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-6">
              <button
                onClick={() => {
                  setShowCustomCss(false);
                  setCustomCssProperty("");
                  setCustomCssValue("");
                }}
                className="px-3 py-1.5 text-sm bg-gray-200 rounded-lg"
              >
                Cancel
              </button>
              <button
                onClick={addCustomCss}
                className="px-3 py-1.5 text-sm bg-indigo-600 text-white rounded-lg"
              >
                Apply CSS
              </button>
            </div>

            <datalist id="custom-properties-datalist">
              {CSS_PROPERTIES.map((prop) => (
                <option key={prop} value={prop} />
              ))}
              <option value="box-shadow" />
              <option value="text-shadow" />
              <option value="background" />
              <option value="background-image" />
              <option value="transition" />
              <option value="animation" />
              <option value="transform" />
              <option value="filter" />
              <option value="backdrop-filter" />
              <option value="clip-path" />
              <option value="object-fit" />
              <option value="object-position" />
              <option value="overflow" />
              <option value="white-space" />
              <option value="word-break" />
              <option value="text-decoration" />
              <option value="text-transform" />
              <option value="gap" />
              <option value="flex" />
              <option value="grid" />
            </datalist>
          </div>
        </div>
      )}
    </div>
  );
}
// ─────────────────────────────────────────────────────────────────────────────
// LIVE PREVIEW COMPONENT
// ─────────────────────────────────────────────────────────────────────────────

function LivePreview({
  page,
  previewData,
  selectedElementId,
  onSelectElement,
  onDragElement,
  onResizeElement,
  zoom,
  onZoomChange,
  enableTextFormatting = false,
}) {
  const dims = getPageDimensions(page.config);
  const [qrCodeUrls, setQrCodeUrls] = useState({});
  const [isGeneratingQr, setIsGeneratingQr] = useState(true);
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [resizeHandle, setResizeHandle] = useState(null);
  const dragStartRef = useRef({
    x: 0,
    y: 0,
    elementId: null,
    startLeft: 0,
    startTop: 0,
    startWidth: 0,
    startHeight: 0,
  });

  // Generate QR codes when page elements change
  useEffect(() => {
    const generateQRCodes = async () => {
      setIsGeneratingQr(true);
      const urls = {};

      const qrElements = page.elements.filter((el) => el.type === "qr");
      console.log("QR Elements found:", qrElements.length);

      for (const el of qrElements) {
        if (el.type === "qr" && el.qrContent) {
          try {
            console.log("Generating QR for:", el.id, "Content:", el.qrContent);
            const url = await QRCode.toDataURL(el.qrContent, {
              margin: 0,
              width: 300,
              color: {
                dark: "#000000",
                light: "#ffffff",
              },
            });
            urls[el.id] = url;
            console.log("QR generated successfully for:", el.id);
          } catch (err) {
            console.error("Failed to generate QR code:", err);
            // Generate a fallback QR code with error message
            try {
              const fallbackUrl = await QRCode.toDataURL("Error", {
                margin: 0,
                width: 300,
              });
              urls[el.id] = fallbackUrl;
            } catch (e) {
              console.error("Failed to generate fallback QR:", e);
            }
          }
        }
      }
      setQrCodeUrls(urls);
      setIsGeneratingQr(false);
    };

    generateQRCodes();
  }, [page.elements]);

  const bgStyle = {};
  if (page.backgroundImage) {
    bgStyle.backgroundImage = `url("${page.backgroundImage}")`;
    bgStyle.backgroundSize = page.bgSize || "cover";
    bgStyle.backgroundPosition = page.bgPosition || "center center";
    bgStyle.backgroundRepeat = "no-repeat";
  }

  const widthUnit = page.config.widthUnit || "px";
  const heightUnit = page.config.heightUnit || "px";
  const scaledWidth = dims.width * zoom;
  const scaledHeight = dims.height * zoom;

  const toCamelCase = (str) => {
    return str.replace(/-([a-z])/g, (g) => g[1].toUpperCase());
  };

  // FIXED: Improved evaluateScript function
  function evaluateScript(script, data) {
    if (!script || script.length === 0) return {};

    const resolved = {};

    for (const rule of script) {
      const { condition, css } = rule;

      let passes = false;

      // default rule
      if (!condition?.condition) {
        passes = true;
      } else {
        const resolvedCompare1 = resolvePlaceholders(
          String(condition.compare1 ?? ""),
          data,
        );
        const a = Number(resolvedCompare1.length);
        const b = Number(condition.compare2 ?? 0);

        switch (condition.condition) {
          case ">":
            passes = a > b;
            break;

          case ">=":
            passes = a >= b;
            break;

          case "<":
            passes = a < b;
            break;

          case "<=":
            passes = a <= b;
            break;

          case "==":
            passes = a === b;
            break;

          case "!=":
            passes = a !== b;
            break;

          default:
            passes = false;
        }
      }

      // apply css
      if (passes) {
        // backward compatibility
        const cssArray = Array.isArray(css) ? css : [css];

        for (const cssItem of cssArray) {
          if (!cssItem?.property) continue;

          // first match wins
          if (
            Object.prototype.hasOwnProperty.call(resolved, cssItem.property)
          ) {
            continue;
          }

          resolved[cssItem.property] = cssItem.value;
        }
        break;
      }
    }
    console.log("============================")
    console.log(resolved);
    console.log("============================")

    return resolved;
  }

  const getElementStyles = (el) => {
    // Base CSS from element's css array
    const styleMap = {};

    for (const { property, value } of el.css || []) {
      if (value) {
        const camelCaseProp = toCamelCase(property);
        styleMap[camelCaseProp] = value;
      }
    }

    // Apply script rules (conditional CSS)
    const scriptProps = evaluateScript(el.script, previewData);

    // Merge script props (they override base CSS if conflicting)
    for (const [p, v] of Object.entries(scriptProps)) {
      if (v) {
        const camelCaseProp = toCamelCase(p);
        styleMap[camelCaseProp] = v;
      }
    }

    // Scale position/size values for zoom
    const scaledStyleMap = {};
    for (const [prop, val] of Object.entries(styleMap)) {
      if (
        [
          "top",
          "left",
          "right",
          "bottom",
          "width",
          "maxWidth",
          "height",
          "maxHeight",
          "zIndex",
          "fontSize",
          "lineHeight",
          "letterSpacing",
          "padding",
          "paddingTop",
          "paddingBottom",
          "paddingLeft",
          "paddingRight",
          "margin",
          "marginTop",
          "marginBottom",
          "marginLeft",
          "marginRight",
          "borderWidth",
          "borderTopWidth",
          "borderBottomWidth",
          "borderLeftWidth",
          "borderRightWidth",
          "borderRadius",
        ].includes(prop)
      ) {
        const { num, unit } = parseValueWithUnit(val);
        if (!isNaN(num)) {
          scaledStyleMap[prop] = `${num * zoom}${unit}`;
        } else {
          scaledStyleMap[prop] = val;
        }
      } else {
        scaledStyleMap[prop] = val;
      }
    }

    return { styleMap, scaledStyleMap };
  };

  const getElementComputedBounds = (el, scaledStyleMap) => {
    const width = parseFloat(scaledStyleMap?.width) || 100;
    const height = parseFloat(scaledStyleMap?.height) || 100;

    let left = 0;
    if (scaledStyleMap?.left !== undefined) {
      left = parseFloat(scaledStyleMap.left) || 0;
    } else if (scaledStyleMap?.right !== undefined) {
      const rightVal = parseFloat(scaledStyleMap.right) || 0;
      left = (dims.width * zoom) - rightVal - width;
    }

    let top = 0;
    if (scaledStyleMap?.top !== undefined) {
      top = parseFloat(scaledStyleMap.top) || 0;
    } else if (scaledStyleMap?.bottom !== undefined) {
      const bottomVal = parseFloat(scaledStyleMap.bottom) || 0;
      top = (dims.height * zoom) - bottomVal - height;
    }

    return { left, top, width, height };
  };

  // Rest of the component remains the same...
  const handleMouseDown = (e, elId, el, handleType = null) => {
    e.stopPropagation();
    e.preventDefault();

    const topProp = el.css.find((c) => c.property === "top");
    const leftProp = el.css.find((c) => c.property === "left");
    const rightProp = el.css.find((c) => c.property === "right");
    const bottomProp = el.css.find((c) => c.property === "bottom");
    const widthProp = el.css.find((c) => c.property === "width");
    const heightProp = el.css.find((c) => c.property === "height");

    const currentWidth = widthProp
      ? parseValueWithUnit(widthProp.value).num
      : 100;
    const currentHeight = heightProp
      ? parseValueWithUnit(heightProp.value).num
      : 100;

    let currentLeft = 0;
    if (leftProp) {
      currentLeft = parseValueWithUnit(leftProp.value).num;
    } else if (rightProp) {
      const rightVal = parseValueWithUnit(rightProp.value).num;
      currentLeft = dims.width - rightVal - currentWidth;
    }

    let currentTop = 0;
    if (topProp) {
      currentTop = parseValueWithUnit(topProp.value).num;
    } else if (bottomProp) {
      const bottomVal = parseValueWithUnit(bottomProp.value).num;
      currentTop = dims.height - bottomVal - currentHeight;
    }

    dragStartRef.current = {
      x: e.clientX,
      y: e.clientY,
      elementId: elId,
      startLeft: currentLeft,
      startTop: currentTop,
      startWidth: currentWidth,
      startHeight: currentHeight,
    };

    if (handleType) {
      setIsResizing(true);
      setResizeHandle(handleType);
    } else {
      setIsDragging(true);
    }
    onSelectElement(elId);
  };

  const handleMouseMove = (e) => {
    if (isDragging && dragStartRef.current.elementId) {
      e.preventDefault();
      const dx = (e.clientX - dragStartRef.current.x) / zoom;
      const dy = (e.clientY - dragStartRef.current.y) / zoom;
      const newLeft = Math.max(0, dragStartRef.current.startLeft + dx);
      const newTop = Math.max(0, dragStartRef.current.startTop + dy);
      onDragElement({ id: dragStartRef.current.elementId, newLeft, newTop });
    }

    if (isResizing && dragStartRef.current.elementId && resizeHandle) {
      e.preventDefault();
      const dx = (e.clientX - dragStartRef.current.x) / zoom;
      const dy = (e.clientY - dragStartRef.current.y) / zoom;

      let newWidth = dragStartRef.current.startWidth;
      let newHeight = dragStartRef.current.startHeight;
      let newLeft = dragStartRef.current.startLeft;
      let newTop = dragStartRef.current.startTop;

      switch (resizeHandle) {
        case "nw":
          newWidth = Math.max(20, dragStartRef.current.startWidth - dx);
          newHeight = Math.max(20, dragStartRef.current.startHeight - dy);
          newLeft =
            dragStartRef.current.startLeft +
            (dragStartRef.current.startWidth - newWidth);
          newTop =
            dragStartRef.current.startTop +
            (dragStartRef.current.startHeight - newHeight);
          break;
        case "n":
          newHeight = Math.max(20, dragStartRef.current.startHeight - dy);
          newTop =
            dragStartRef.current.startTop +
            (dragStartRef.current.startHeight - newHeight);
          break;
        case "ne":
          newWidth = Math.max(20, dragStartRef.current.startWidth + dx);
          newHeight = Math.max(20, dragStartRef.current.startHeight - dy);
          newTop =
            dragStartRef.current.startTop +
            (dragStartRef.current.startHeight - newHeight);
          break;
        case "e":
          newWidth = Math.max(20, dragStartRef.current.startWidth + dx);
          break;
        case "se":
          newWidth = Math.max(20, dragStartRef.current.startWidth + dx);
          newHeight = Math.max(20, dragStartRef.current.startHeight + dy);
          break;
        case "s":
          newHeight = Math.max(20, dragStartRef.current.startHeight + dy);
          break;
        case "sw":
          newWidth = Math.max(20, dragStartRef.current.startWidth - dx);
          newHeight = Math.max(20, dragStartRef.current.startHeight + dy);
          newLeft =
            dragStartRef.current.startLeft +
            (dragStartRef.current.startWidth - newWidth);
          break;
        case "w":
          newWidth = Math.max(20, dragStartRef.current.startWidth - dx);
          newLeft =
            dragStartRef.current.startLeft +
            (dragStartRef.current.startWidth - newWidth);
          break;
      }

      onResizeElement({
        id: dragStartRef.current.elementId,
        newLeft,
        newTop,
        newWidth,
        newHeight,
      });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
    setIsResizing(false);
    setResizeHandle(null);
    dragStartRef.current = {
      x: 0,
      y: 0,
      elementId: null,
      startLeft: 0,
      startTop: 0,
      startWidth: 0,
      startHeight: 0,
    };
  };

  useEffect(() => {
    if (isDragging || isResizing) {
      window.addEventListener("mousemove", handleMouseMove);
      window.addEventListener("mouseup", handleMouseUp);
      return () => {
        window.removeEventListener("mousemove", handleMouseMove);
        window.removeEventListener("mouseup", handleMouseUp);
      };
    }
  }, [isDragging, isResizing, zoom, resizeHandle]);

  const sortedElements = [...page.elements].sort((a, b) => {
    const aZ = a.css.find((c) => c.property === "z-index")?.value || 0;
    const bZ = b.css.find((c) => c.property === "z-index")?.value || 0;
    return parseInt(aZ) - parseInt(bZ);
  });

  const getElementActualHeight = (elId, scaledStyleMap) => {
    // agar explicit height css main mojood hai
    if (
      scaledStyleMap &&
      Object.prototype.hasOwnProperty.call(scaledStyleMap, "height") &&
      scaledStyleMap.height
    ) {
      return parseFloat(scaledStyleMap.height) || 0;
    }

    // actual rendered dom element
    const domEl = document.querySelector(`[data-element-id="${elId}"]`);

    if (domEl) {
      return domEl.getBoundingClientRect().height;
    }

    return 40; // fallback
  };

  const getResizeHandles = (el, scaledStyleMap) => {
    const { left, top, width: w, height: h } = getElementComputedBounds(el, scaledStyleMap);

    const width = w - 2;

    let height;

    // IMPORTANT AUTO HEIGHT FIX
    const hasHeight = el.css?.some((c) => c.property === "height");

    if (hasHeight) {
      height = h - 2;
    } else {
      height = getElementActualHeight(el.id, scaledStyleMap) - 2;
    }

    const handles = [];

    // TOP (N)
    for (let x = 1; x < width; x += 6) {
      for (let y = 1; y < 20; y += 4) {
        handles.push({
          type: "n",
          left: left + x,
          top: top + y,
          cursor: "n-resize",
        });
        handles.push({
          type: "n",
          left: left + x,
          top: top - y,
          cursor: "n-resize",
        });
      }
    }

    // BOTTOM (S)
    for (let x = 1; x < width; x += 6) {
      for (let y = 1; y < 20; y += 4) {
        handles.push({
          type: "s",
          left: left + x,
          top: top + height + y,
          cursor: "s-resize",
        });
        handles.push({
          type: "s",
          left: left + x,
          top: top + height - y,
          cursor: "s-resize",
        });
      }
    }

    // LEFT (W)
    for (let y = 1; y < height; y += 6) {
      for (let x = 1; x < 20; x += 4) {
        handles.push({
          type: "w",
          left: left - x,
          top: top + y,
          cursor: "w-resize",
        });
        handles.push({
          type: "w",
          left: left + x,
          top: top + y,
          cursor: "w-resize",
        });
      }
    }

    // RIGHT (E)
    for (let y = 1; y < height; y += 6) {
      for (let x = 1; x < 20; x += 4) {
        handles.push({
          type: "e",
          left: left + width + x,
          top: top + y,
          cursor: "e-resize",
        });
        handles.push({
          type: "e",
          left: left + width - x,
          top: top + y,
          cursor: "e-resize",
        });
      }
    }

    // CORNERS
    handles.push(
      {
        type: "nw",
        left: left - 4,
        top: top - 4,
        cursor: "nw-resize",
      },
      {
        type: "ne",
        left: left + width - 4,
        top: top - 4,
        cursor: "ne-resize",
      },
      {
        type: "sw",
        left: left - 4,
        top: top + height - 4,
        cursor: "sw-resize",
      },
      {
        type: "se",
        left: left + width - 4,
        top: top + height - 4,
        cursor: "se-resize",
      },
    );

    return handles;
  };

  return (
    <div className="flex flex-col items-center gap-3 w-full">
      <div className="flex flex-col sm:flex-row items-center gap-2 sm:gap-4 bg-white px-4 py-2.5 sm:py-2 rounded-lg shadow-sm sticky top-0 z-10 w-full sm:w-auto border border-gray-150">
        {/* SLIDER ROW */}
        <div className="flex items-center justify-between sm:justify-start gap-3 w-full sm:w-auto">
          <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider shrink-0">Zoom:</span>
          <input
            type="range"
            min="0.25"
            max="2"
            step="0.01"
            value={zoom}
            onChange={(e) => onZoomChange(parseFloat(e.target.value))}
            className="w-full sm:w-48 h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
          />
          <span className="text-xs font-bold text-gray-700 min-w-[50px] text-right shrink-0">
            {Math.round(zoom * 100)}%
          </span>
        </div>

        {/* BUTTONS ROW (Centered on mobile, inline on desktop) */}
        <div className="flex items-center justify-center gap-1.5 w-full sm:w-auto border-t border-gray-100 sm:border-t-0 pt-2 sm:pt-0">
          <button
            onClick={() => onZoomChange(Math.max(0.25, zoom - 0.1))}
            className="px-3 py-1.5 sm:px-2.5 sm:py-1 text-xs font-medium bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors shrink-0"
          >
            -
          </button>
          <button
            onClick={() => onZoomChange(Math.min(2, zoom + 0.1))}
            className="px-3 py-1.5 sm:px-2.5 sm:py-1 text-xs font-medium bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors shrink-0"
          >
            +
          </button>
          <button
            onClick={() => onZoomChange(1)}
            className="px-3.5 py-1.5 sm:px-3 sm:py-1 text-xs font-semibold bg-indigo-100 text-indigo-700 rounded-lg hover:bg-indigo-200 transition-colors shrink-0"
          >
            Reset
          </button>
        </div>
      </div>

      <div
        className="relative border border-gray-200 rounded-lg bg-gray-100"
        style={{ width: "100%", height: "70vh", overflow: "auto" }}
      >
        <style>{`
          .preview-scroll-container { scrollbar-width: none; -ms-overflow-style: none; }
          .preview-scroll-container::-webkit-scrollbar { display: none; }
          .resize-handle {
            position: absolute;
            width: 10px;
            height: 10px;
            background-color: #6366f1;
            border: 1px solid white;
            border-radius: 1px;
            z-index: 1000;
            pointer-events: auto;
            opacity: 0;
          }
          .resize-handle:hover {
            transform: scale(1.2);
            background-color: #4f46e5;
          }
        `}</style>

        <div
          className="preview-scroll-container"
          style={{ width: "100%", height: "100%", overflow: "auto" }}
        >
          <div
            style={{
              width: `${scaledWidth}${widthUnit}`,
              height: `${scaledHeight}${heightUnit}`,
              position: "relative",
              backgroundColor: "#fff",
              margin: "auto",
              ...bgStyle,
              backgroundSize: page.bgSize || "cover",
              backgroundPosition: page.bgPosition || "center center",
              boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
            }}
          >
            {sortedElements.map((el) => {
              const { scaledStyleMap } = getElementStyles(el);
              const isSelected = el.id === selectedElementId;

              if (el.type === "image") {
                let imgSrc = el.imageUrl || "";
                if (!imgSrc) {
                  imgSrc = "/user.png";
                } else if (imgSrc.startsWith("{{")) {
                  const resolved = resolvePlaceholders(imgSrc, previewData);
                  imgSrc = resolved !== imgSrc ? resolved : "/user.png";
                }
                return (
                  <div key={el.id} style={{ display: "contents" }}>
                    <div
                      onMouseDown={(e) => handleMouseDown(e, el.id, el)}
                      data-element-id={el.id}
                      style={{
                        position: "absolute",

                        cursor: isDragging ? "grabbing" : "grab",

                        outline: isSelected ? "2px solid #6366f1" : "none",
                        outlineOffset: "1px",

                        overflow: "hidden",

                        borderRadius: scaledStyleMap.borderRadius || "0px",

                        width: scaledStyleMap?.maxWidth ? "auto":(scaledStyleMap.width),
                        height: scaledStyleMap?.maxHeight ? "auto":(scaledStyleMap.height),

                        ...scaledStyleMap,
                      }}
                    >
                      <img
                        src={imgSrc}
                        alt=""
                        draggable={false}
                        onError={(e) => {
                          e.target.src = "/user.png";
                        }}
                        style={{
                          width: "100%",
                          height: "100%",

                          objectFit: scaledStyleMap?.ObjectFit ? (scaledStyleMap.ObjectFit):"contain",

                          borderRadius:
                            `calc(${scaledStyleMap.borderRadius || "0px"} - 3px)` ||
                            "0px",

                          display: "block",
                        }}
                      />
                    </div>

                    {isSelected && (
                      <div>
                        {getResizeHandles(el, scaledStyleMap).map(
                          (handle, idx) => (
                            <div
                              key={idx}
                              className="resize-handle"
                              style={{
                                left: handle.left,
                                top: handle.top,
                                cursor: handle.cursor,
                              }}
                              onMouseDown={(e) =>
                                handleMouseDown(e, el.id, el, handle.type)
                              }
                            />
                          ),
                        )}
                      </div>
                    )}
                  </div>
                );
              }

              if (el.type === "qr") {
                if (isGeneratingQr) {
                  return (
                    <div
                      key={el.id}
                      style={{
                        position: "absolute",
                        ...scaledStyleMap,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        backgroundColor: "#f0f0f0",
                      }}
                    >
                      <span style={{ fontSize: "12px", color: "#999" }}>
                        Loading QR...
                      </span>
                    </div>
                  );
                }

                const qrUrl = qrCodeUrls[el.id];

                if (!qrUrl) {
                  return (
                    <div
                      key={el.id}
                      style={{
                        position: "absolute",
                        ...scaledStyleMap,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        backgroundColor: "#fee",
                      }}
                    >
                      <span style={{ fontSize: "12px", color: "#c00" }}>
                        QR Error
                      </span>
                    </div>
                  );
                }

                return (
                  <div key={el.id} style={{ display: "contents" }}>
                    <div
                      onMouseDown={(e) => handleMouseDown(e, el.id, el)}
                      data-element-id={el.id}
                      style={{
                        position: "absolute",

                        cursor: isDragging ? "grabbing" : "grab",

                        outline: isSelected ? "2px solid #6366f1" : "none",
                        outlineOffset: "1px",

                        overflow: "hidden",

                        width: scaledStyleMap.width,
                        height: scaledStyleMap.height,

                        ...scaledStyleMap,
                        borderRadius: scaledStyleMap.borderRadius || "0px",
                      }}
                    >
                      <img
                        src={qrUrl}
                        alt="QR Code"
                        draggable={false}
                        style={{
                          width: "100%",
                          height: "100%",

                          objectFit: "cover",

                          borderRadius:
                            `calc(${scaledStyleMap.borderRadius || "0px"} - 3px)` ||
                            "0px",

                          display: "block",
                        }}
                      />
                    </div>

                    {isSelected && (
                      <div>
                        {getResizeHandles(el, scaledStyleMap).map(
                          (handle, idx) => (
                            <div
                              key={idx}
                              className="resize-handle"
                              style={{
                                left: handle.left,
                                top: handle.top,
                                cursor: handle.cursor,
                              }}
                              onMouseDown={(e) =>
                                handleMouseDown(e, el.id, el, handle.type)
                              }
                            />
                          ),
                        )}
                      </div>
                    )}
                  </div>
                );
              }

              const resolvedText = resolvePlaceholders(
                el.text || "",
                previewData,
              );
              let displayText = resolvedText;
              if (el.enableTextFormatting || enableTextFormatting) {
                const { firstLine, secondLine } = formatTextWithLineBreak(
                  resolvedText,
                  el.maxWordsPerLine || 3,
                );
                displayText = secondLine
                  ? `<div>${firstLine}</div><div>${secondLine}</div>`
                  : firstLine;
              }

              return (
                <div key={el.id} style={{ display: "contents" }}>
                  <div
                    onMouseDown={(e) => handleMouseDown(e, el.id, el)}
                    data-element-id={el.id}
                    style={{
                      position: "absolute",
                      cursor: isDragging ? "grabbing" : "grab",
                      outline: isSelected ? "2px solid #6366f1" : "none",
                      outlineOffset: "1px",
                      ...scaledStyleMap,
                    }}
                    dangerouslySetInnerHTML={{ __html: displayText }}
                    draggable={false}
                  />
                  {isSelected && (
                    <div>
                      {getResizeHandles(el, scaledStyleMap).map(
                        (handle, idx) => (
                          <div
                            key={idx}
                            className="resize-handle"
                            style={{
                              left: handle.left,
                              top: handle.top,
                              cursor: handle.cursor,
                            }}
                            onMouseDown={(e) =>
                              handleMouseDown(e, el.id, el, handle.type)
                            }
                          />
                        ),
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN EDITOR PAGE
// ─────────────────────────────────────────────────────────────────────────────

export default function TemplateEditorPage() {
  const params = useParams();
  const router = useRouter();
  const { type, id } = params;
  const {
    fetchTemplateById,
    saveDesign,
    saveDraftDebounced,
    loadDraft,
    clearDraft,
  } = useTemplate();

  const [templateMeta, setTemplateMeta] = useState(null);
  const [pages, setPages] = useState([]);
  const [currentPageIdx, setCurrentPageIdx] = useState(0);
  const [selectedElementId, setSelectedElementId] = useState(null);
  const [editingElement, setEditingElement] = useState(null);
  const [showElementEditor, setShowElementEditor] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [showDraftModal, setShowDraftModal] = useState(false);
  const [draftData, setDraftData] = useState(null);
  const [saveStatus, setSaveStatus] = useState("idle");
  const [draftStatus, setDraftStatus] = useState("");
  const [previewData, setPreviewData] = useState(() => getSampleData(type));
  const [pageLoading, setPageLoading] = useState(true);
  const [zoom, setZoom] = useState(1);
  const [dragging, setDragging] = useState(null);
  const [showQREditor, setShowQREditor] = useState(false);
  const [isInitialLoad, setIsInitialLoad] = useState(true);

  useEffect(() => {
    loadCustomFonts();
  }, []);

  const currentPage = pages[currentPageIdx] ?? null;

  useEffect(() => {
    async function load() {
      setPageLoading(true);
      try {
        const tmpl = await fetchTemplateById(id);
        if (!tmpl) {
          router.push(`/owner/pdf-template/${type}`);
          return;
        }

        setTemplateMeta({
          name: tmpl.name,
          type: tmpl.type,
          isActive: tmpl.isActive,
        });

        // Check for draft in localStorage
        const draft = loadDraft(type, id);
        const dbPages = tmpl.designData?.pages ?? [];

        // Function to validate and fix element structure
        const validateAndFixPages = (pages) => {
          return pages.map((page) => ({
            ...page,
            config: {
              format: page.config?.format || "A4",
              orientation: page.config?.orientation || "portrait",
              customWidth: page.config?.customWidth || 800,
              customHeight: page.config?.customHeight || 600,
              widthUnit: page.config?.widthUnit || "px",
              heightUnit: page.config?.heightUnit || "px",
              margin: page.config?.margin || 0,
              marginUnit: page.config?.marginUnit || "px",
            },
            backgroundImage: page.backgroundImage || null,
            bgSize: page.bgSize || "cover",
            bgPosition: page.bgPosition || "center center",
            elements: (page.elements || []).map((el) => ({
              id: el.id || uid(),
              type: el.type,
              text: el.text || "",
              imageUrl: el.imageUrl || null,
              qrContent:
                el.qrContent ||
                (el.type === "qr" ? "https://www.example.com" : null),
              enableTextFormatting: el.enableTextFormatting || false,
              maxWordsPerLine: el.maxWordsPerLine || 3,
              css: el.css || [
                { property: "top", value: "100px" },
                { property: "left", value: "100px" },
                { property: "width", value: "100px" },
                { property: "height", value: "100px" },
                ...(el.type === "text"
                  ? [{ property: "font-size", value: "16px" }]
                  : []),
                { property: "z-index", value: "1" },
              ],
              script: el.script || [],
            })),
          }));
        };

        // Case 1: Both draft and DB data exist - ask user
        if (draft?.designData?.pages?.length > 0 && dbPages.length > 0) {
          setDraftData(draft);
          setShowDraftModal(true);
          setIsInitialLoad(false);
        }
        // Case 2: Only draft exists
        else if (draft?.designData?.pages?.length > 0) {
          const validatedPages = validateAndFixPages(draft.designData.pages);
          setPages(validatedPages);
          setShowDraftModal(false);
        }
        // Case 3: Only DB data exists
        else if (dbPages.length > 0) {
          const validatedPages = validateAndFixPages(dbPages);
          setPages(validatedPages);
          setShowDraftModal(false);
        }
        // Case 4: No data exists
        else {
          setPages([createDefaultPage(1)]);
          setShowDraftModal(false);
        }
      } catch (error) {
        console.error("Error loading template:", error);
        setPages([createDefaultPage(1)]);
      } finally {
        setPageLoading(false);
        setIsInitialLoad(false);
      }
    }
    load();
  }, [id, type]);

  // Save draft only when pages change AND it's not initial load
  useEffect(() => {
    if (pages.length === 0 || pageLoading || isInitialLoad) return;
    saveDraftDebounced(type, id, { pages });
    setDraftStatus("Saving draft...");
    const t = setTimeout(() => setDraftStatus("Draft saved"), 1500);
    return () => clearTimeout(t);
  }, [pages]);

  // Rest of the functions remain same (updateCurrentPage, addPage, deletePage, addElement, etc.)
  // ... (all the same as before)

  function updateCurrentPage(updater) {
    setPages((prev) =>
      prev.map((p, i) => (i === currentPageIdx ? updater(p) : p)),
    );
  }

  function addPage() {
    const prev = pages[pages.length - 1];
    const newPage = createDefaultPage(pages.length + 1, prev?.config);
    setPages((p) => [...p, newPage]);
    setCurrentPageIdx(pages.length);
    setSelectedElementId(null);
  }

  function deletePage(idx) {
    if (pages.length === 1) return;
    setPages((prev) =>
      prev
        .filter((_, i) => i !== idx)
        .map((p, i) => ({ ...p, pageNumber: i + 1 })),
    );
    setCurrentPageIdx((prev) => Math.max(0, prev > idx ? prev - 1 : prev));
    setSelectedElementId(null);
  }

  function addElement(type) {
    const newEl = {
      id: uid(),
      type,
      text: type === "text" ? "New Text" : "",
      imageUrl: null,
      qrContent: type === "qr" ? "https://www.example.com" : null,
      css: [
        { property: "top", value: "100px" },
        { property: "left", value: "100px" },
        { property: "width", value: "100px" },
        { property: "height", value: "100px" },
        ...(type === "text" ? [{ property: "font-size", value: "16px" }] : []),
        { property: "z-index", value: "1" },
      ],
      script: [],
    };
    updateCurrentPage((p) => ({ ...p, elements: [...p.elements, newEl] }));
    setSelectedElementId(newEl.id);
    setEditingElement(newEl);
    setShowElementEditor(true);
  }

  function addQRElement(qrStyles) {
    const newEl = {
      id: uid(),
      type: "qr",
      qrContent: "https://www.example.com",
      css: [
        { property: "top", value: qrStyles.top },
        { property: "left", value: qrStyles.left },
        { property: "width", value: qrStyles.width },
        { property: "height", value: qrStyles.height },
        { property: "border", value: qrStyles.border },
        { property: "borderRadius", value: qrStyles.borderRadius },
        { property: "z-index", value: "1" },
      ],
      script: [],
    };
    updateCurrentPage((p) => ({ ...p, elements: [...p.elements, newEl] }));
    setSelectedElementId(newEl.id);
    setShowQREditor(false);
  }

  function updateElement(updated) {
    const cleanedScript = (updated.script || [])
      .map((rule) => {
        // Clean up the CSS items in the rule
        const cleanedCss = (rule.css || []).filter(
          (c) => c && c.property?.trim() && c.value?.trim(),
        );
        return {
          ...rule,
          css: cleanedCss,
        };
      })
      .filter((rule) => {
        // If there's no CSS configured for this rule at all, do not add it!
        if (rule.css.length === 0) return false;

        // If it's a conditional rule, it must also have a condition operator
        const isDefault = !rule.condition?.condition;
        if (!isDefault) {
          if (!rule.condition.compare1?.trim()) return false;
        }

        return true;
      });

    const cleanedElement = {
      ...updated,
      script: cleanedScript,
    };

    updateCurrentPage((p) => ({
      ...p,
      elements: p.elements.map((el) =>
        el.id === cleanedElement.id ? cleanedElement : el,
      ),
    }));
    setEditingElement(null);
    setShowElementEditor(false);
    setSelectedElementId(cleanedElement.id);
  }

  function cloneElement(el) {
    const cloned = { ...JSON.parse(JSON.stringify(el)), id: uid() };
    cloned.css = cloned.css.map((c) => {
      if (c.property === "top")
        return { ...c, value: `${parseInt(c.value) + 20}px` };
      if (c.property === "left")
        return { ...c, value: `${parseInt(c.value) + 20}px` };
      return c;
    });
    updateCurrentPage((p) => ({ ...p, elements: [...p.elements, cloned] }));
  }

  function deleteElement(id) {
    updateCurrentPage((p) => ({
      ...p,
      elements: p.elements.filter((el) => el.id !== id),
    }));
    setSelectedElementId(null);
  }

  function dragElement(id, newLeft, newTop) {
    updateCurrentPage((p) => {
      const dims = getPageDimensions(p.config);
      return {
        ...p,
        elements: p.elements.map((el) => {
          if (el.id !== id) return el;

          const hasRight = el.css.some((c) => c.property === "right");
          const hasBottom = el.css.some((c) => c.property === "bottom");
          const widthProp = el.css.find((c) => c.property === "width");
          const heightProp = el.css.find((c) => c.property === "height");

          const widthVal = widthProp ? parseValueWithUnit(widthProp.value).num : 100;
          const heightVal = heightProp ? parseValueWithUnit(heightProp.value).num : 100;

          return {
            ...el,
            css: el.css.map((c) => {
              if (c.property === "top" && !hasBottom) {
                return {
                  ...c,
                  value: `${Math.max(0, Math.round(newTop))}px`,
                };
              }
              if (c.property === "bottom" && hasBottom) {
                const newBottom = dims.height - newTop - heightVal;
                return {
                  ...c,
                  value: `${Math.max(0, Math.round(newBottom))}px`,
                };
              }
              if (c.property === "left" && !hasRight) {
                return {
                  ...c,
                  value: `${Math.max(0, Math.round(newLeft))}px`,
                };
              }
              if (c.property === "right" && hasRight) {
                const newRight = dims.width - newLeft - widthVal;
                return {
                  ...c,
                  value: `${Math.max(0, Math.round(newRight))}px`,
                };
              }
              return c;
            }),
          };
        }),
      };
    });
  }

  function resizeElement(id, newLeft, newTop, newWidth, newHeight) {
    updateCurrentPage((p) => {
      const dims = getPageDimensions(p.config);
      return {
        ...p,
        elements: p.elements.map((el) => {
          if (el.id !== id) return el;

          const hasRight = el.css.some((c) => c.property === "right");
          const hasBottom = el.css.some((c) => c.property === "bottom");

          return {
            ...el,
            css: el.css.map((c) => {
              if (c.property === "top" && !hasBottom) {
                return {
                  ...c,
                  value: `${Math.max(0, Math.round(newTop))}px`,
                };
              }
              if (c.property === "bottom" && hasBottom) {
                const newBottom = dims.height - newTop - newHeight;
                return {
                  ...c,
                  value: `${Math.max(0, Math.round(newBottom))}px`,
                };
              }
              if (c.property === "left" && !hasRight) {
                return {
                  ...c,
                  value: `${Math.max(0, Math.round(newLeft))}px`,
                };
              }
              if (c.property === "right" && hasRight) {
                const newRight = dims.width - newLeft - newWidth;
                return {
                  ...c,
                  value: `${Math.max(0, Math.round(newRight))}px`,
                };
              }
              if (c.property === "width") {
                return {
                  ...c,
                  value: `${Math.max(20, Math.round(newWidth))}px`,
                };
              }
              if (c.property === "height") {
                return {
                  ...c,
                  value: `${Math.max(20, Math.round(newHeight))}px`,
                };
              }
              return c;
            }),
          };
        }),
      };
    });
  }

  function moveElementUp(elementId) {
    const elements = [...currentPage.elements];
    const index = elements.findIndex((el) => el.id === elementId);
    if (index > 0) {
      [elements[index - 1], elements[index]] = [
        elements[index],
        elements[index - 1],
      ];
      updateCurrentPage((p) => ({ ...p, elements }));
    }
  }

  function moveElementDown(elementId) {
    const elements = [...currentPage.elements];
    const index = elements.findIndex((el) => el.id === elementId);
    if (index < elements.length - 1) {
      [elements[index], elements[index + 1]] = [
        elements[index + 1],
        elements[index],
      ];
      updateCurrentPage((p) => ({ ...p, elements }));
    }
  }

  async function handleSave() {
    setSaveStatus("saving");
    try {
      const designData = {
        pages: pages.map((page) => ({
          pageNumber: page.pageNumber,
          config: page.config || {
            format: "A4",
            orientation: "portrait",
            margin: 0,
            marginUnit: "px",
          },
          backgroundImage: page.backgroundImage || null,
          bgSize: page.bgSize || "cover",
          bgPosition: page.bgPosition || "center center",
          elements: page.elements.map((el) => ({
            id: el.id,
            type: el.type,
            text: el.text || "",
            imageUrl: el.imageUrl || null,
            qrContent: el.qrContent || null,
            enableTextFormatting: el.enableTextFormatting || false,
            maxWordsPerLine: el.maxWordsPerLine || 3,
            css: el.css || [],
            script: el.script || [],
          })),
        })),
      };

      const result = await saveDesign(id, designData);
      if (result) {
        setSaveStatus("saved");
        clearDraft(type, id);
        setDraftStatus("");
        setTimeout(() => setSaveStatus("idle"), 2500);
      } else {
        setSaveStatus("error");
        setTimeout(() => setSaveStatus("idle"), 3000);
      }
    } catch (error) {
      console.error("Save error:", error);
      setSaveStatus("error");
      setTimeout(() => setSaveStatus("idle"), 3000);
    }
  }

  function handleLoadDraft() {
    const validateAndFixPages = (pages) => {
      return pages.map((page) => ({
        ...page,
        config: {
          format: page.config?.format || "A4",
          orientation: page.config?.orientation || "portrait",
          customWidth: page.config?.customWidth || 800,
          customHeight: page.config?.customHeight || 600,
          widthUnit: page.config?.widthUnit || "px",
          heightUnit: page.config?.heightUnit || "px",
          margin: page.config?.margin || 0,
          marginUnit: page.config?.marginUnit || "px",
        },
        backgroundImage: page.backgroundImage || null,
        bgSize: page.bgSize || "cover",
        bgPosition: page.bgPosition || "center center",
        elements: (page.elements || []).map((el) => ({
          id: el.id || uid(),
          type: el.type,
          text: el.text || "",
          imageUrl: el.imageUrl || null,
          qrContent: el.qrContent || null,
          enableTextFormatting: el.enableTextFormatting || false,
          maxWordsPerLine: el.maxWordsPerLine || 3,
          css: el.css || [
            { property: "top", value: "100px" },
            { property: "left", value: "100px" },
            { property: "width", value: "100px" },
            { property: "height", value: "100px" },
            ...(el.type === "text"
              ? [{ property: "font-size", value: "16px" }]
              : []),
            { property: "z-index", value: "1" },
          ],
          script: el.script || [],
        })),
      }));
    };

    if (draftData?.designData?.pages) {
      const validatedPages = validateAndFixPages(draftData.designData.pages);
      setPages(validatedPages);
    }
    setShowDraftModal(false);
    setDraftData(null);
  }

  function handleDiscardDraft() {
    clearDraft(type, id);
    setShowDraftModal(false);
    setDraftData(null);
    window.location.reload();
  }

  if (pageLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-3">
          <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto" />
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  const selectedEl =
    currentPage?.elements.find((el) => el.id === selectedElementId) ?? null;

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      <header className="bg-white border-b px-4 py-2.5 flex flex-wrap items-center gap-3 sticky top-0 z-20 shadow-sm">
        <button
          onClick={() => router.push(`/owner/pdf-template/${type}`)}
          className="text-gray-400 hover:text-gray-700 text-lg"
        >
          ←
        </button>
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-400">Template:</span>
          <span className="font-semibold text-sm">{templateMeta?.name}</span>
          {templateMeta?.isActive && <Badge color="green">Active</Badge>}
        </div>
        <div className="flex-1" />
        {draftStatus && (
          <span className="text-xs text-gray-400 hidden sm:block">
            {draftStatus}
          </span>
        )}
        <Btn
          variant={
            saveStatus === "saved"
              ? "success"
              : saveStatus === "error"
                ? "danger"
                : "primary"
          }
          size="sm"
          onClick={handleSave}
          disabled={saveStatus === "saving"}
        >
          {saveStatus === "saving"
            ? "Saving..."
            : saveStatus === "saved"
              ? "✓ Saved!"
              : saveStatus === "error"
                ? "⚠ Error"
                : "💾 Save"}
        </Btn>
      </header>

      <div className="bg-white border-b px-4 py-2 flex flex-wrap items-center gap-2 sticky top-[57px] z-10">
        {pages.map((page, idx) => (
          <div key={idx} className="flex items-center gap-1">
            <button
              onClick={() => {
                setCurrentPageIdx(idx);
                setSelectedElementId(null);
              }}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg ${currentPageIdx === idx ? "bg-indigo-600 text-white shadow-sm" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}
            >
              Page {page.pageNumber}
            </button>
            {pages.length > 1 && (
              <button
                onClick={() => {
                  setDeleteTarget({ type: "page", idx });
                  setShowDeleteConfirm(true);
                }}
                className="text-gray-300 hover:text-red-500 px-0.5"
              >
                ×
              </button>
            )}
          </div>
        ))}
        <Btn size="xs" variant="ghost" onClick={addPage}>
          + Add Page
        </Btn>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 flex-1 overflow-hidden">
        <div className="w-full col-span-1 bg-white border-b lg:border-b-0 lg:border-r border-gray-200 flex flex-col max-h-[40vh] lg:max-h-none overflow-y-auto">
          <div className="p-3 border-b sticky top-0 bg-white z-10">
            <p className="text-xs font-semibold text-gray-400 mb-2">
              Add Element
            </p>
            <div className="flex flex-row lg:flex-col gap-2">
              <Btn
                size="xs"
                variant="secondary"
                onClick={() => addElement("text")}
                className="justify-center lg:justify-start flex-1"
              >
                📝 Add Text
              </Btn>
              <Btn
                size="xs"
                variant="secondary"
                onClick={() => addElement("image")}
                className="justify-center lg:justify-start flex-1"
              >
                🖼️ Add Image
              </Btn>
              <Btn
                size="xs"
                variant="secondary"
                onClick={() => setShowQREditor(true)}
                className="justify-center lg:justify-start flex-1"
              >
                📱 Add QR Code
              </Btn>
            </div>
          </div>
          <div className="flex-1 p-3 overflow-y-auto">
            <p className="text-xs font-semibold text-gray-400 mb-2">
              Elements (Page {currentPage?.pageNumber})
            </p>
            {currentPage?.elements.length === 0 && (
              <p className="text-xs text-gray-300 text-center py-4">
                No elements yet
              </p>
            )}
            <div className="space-y-1.5">
              {currentPage?.elements.map((el, idx) => (
                <div
                  key={el.id}
                  onClick={() => setSelectedElementId(el.id)}
                  className={`p-2 rounded-lg border cursor-pointer ${selectedElementId === el.id ? "border-indigo-400 bg-indigo-50" : "border-gray-100 hover:border-gray-200 bg-white"}`}
                >
                  <div className="flex items-center justify-between flex-wrap gap-1">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          moveElementUp(el.id);
                        }}
                        disabled={idx === 0}
                        className="text-gray-400 hover:text-gray-600 disabled:opacity-30"
                      >
                        ↑
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          moveElementDown(el.id);
                        }}
                        disabled={idx === currentPage.elements.length - 1}
                        className="text-gray-400 hover:text-gray-600 disabled:opacity-30"
                      >
                        ↓
                      </button>
                      <span className="text-sm">
                        {el.type === "image"
                          ? "🖼️"
                          : el.type === "qr"
                            ? "📱"
                            : "📝"}
                      </span>
                      <span className="text-xs font-medium truncate max-w-28 flex-1">
                        {el.type === "text"
                          ? el.text?.slice(0, 20) || "Empty"
                          : el.type === "qr"
                            ? "QR Code"
                            : "Image"}
                      </span>
                    </div>
                    {el.script?.length > 0 && (
                      <Badge color="blue">{el.script.length}</Badge>
                    )}
                    <div className="flex gap-1">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedElementId(el.id);
                          setShowElementEditor(true);
                        }}
                        className="text-xs text-indigo-500"
                      >
                        Edit
                      </button>
                      <span className="text-gray-300">·</span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          cloneElement(el);
                        }}
                        className="text-xs text-gray-400"
                      >
                        Clone
                      </button>
                      <span className="text-gray-300">·</span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteElement(el.id);
                        }}
                        className="text-xs text-red-400"
                      >
                        Del
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <main className="flex-1 overflow-auto col-span-2 p-4">
          {currentPage && (
            <div className="space-y-4">
              <PageConfigPanel
                config={currentPage.config}
                backgroundImage={currentPage.backgroundImage}
                bgSize={currentPage.bgSize || "cover"}
                bgPosition={currentPage.bgPosition || "center center"}
                onChange={(newConfig) =>
                  updateCurrentPage((p) => ({ ...p, config: newConfig }))
                }
                onBgChange={(uri) =>
                  updateCurrentPage((p) => ({ ...p, backgroundImage: uri }))
                }
                onBgSizeChange={(size) =>
                  updateCurrentPage((p) => ({ ...p, bgSize: size }))
                }
                onBgPositionChange={(pos) =>
                  updateCurrentPage((p) => ({ ...p, bgPosition: pos }))
                }
              />
              <LivePreview
                page={currentPage}
                previewData={previewData}
                selectedElementId={selectedElementId}
                onSelectElement={setSelectedElementId}
                onDragElement={({ id, newLeft, newTop }) =>
                  dragElement(id, newLeft, newTop)
                }
                onResizeElement={({
                  id,
                  newLeft,
                  newTop,
                  newWidth,
                  newHeight,
                }) => resizeElement(id, newLeft, newTop, newWidth, newHeight)}
                zoom={zoom}
                onZoomChange={setZoom}
              />
            </div>
          )}
        </main>

        <div className="w-full col-span-1 bg-white border-t lg:border-t-0 lg:border-l border-gray-200 flex flex-col max-h-[40vh] lg:max-h-none overflow-y-auto">
          <div className="p-3 border-b sticky top-0 bg-white">
            <p className="text-xs font-semibold text-gray-400">Properties</p>
          </div>
          <div className="flex-1 p-3 overflow-y-auto">
            {selectedEl ? (
              <div className="space-y-3">
                <div className="flex gap-1.5 flex-wrap">
                  <Btn
                    size="xs"
                    variant="primary"
                    onClick={() => {
                      setEditingElement(selectedEl);
                      setShowElementEditor(true);
                    }}
                    className="flex-1 justify-center"
                  >
                    Edit Full
                  </Btn>
                  <Btn
                    size="xs"
                    variant="secondary"
                    onClick={() => cloneElement(selectedEl)}
                  >
                    Clone
                  </Btn>
                  <Btn
                    size="xs"
                    variant="danger"
                    onClick={() => deleteElement(selectedEl.id)}
                  >
                    Delete
                  </Btn>
                </div>
                {(() => {
                  const hasRight = selectedEl.css.some((c) => c.property === "right");
                  const hasBottom = selectedEl.css.some((c) => c.property === "bottom");
                  const activeHoriz = hasRight ? "right" : "left";
                  const activeVert = hasBottom ? "bottom" : "top";

                  const handleHorizontalToggle = (targetProp) => {
                    const widthProp = selectedEl.css.find((c) => c.property === "width") || { value: "100px" };
                    const currentLeftProp = selectedEl.css.find((c) => c.property === "left");
                    const currentRightProp = selectedEl.css.find((c) => c.property === "right");
                    const dims = getPageDimensions(currentPage.config);

                    let newCss = selectedEl.css.filter((c) => c.property !== "left" && c.property !== "right");

                    if (targetProp === "right") {
                      const leftVal = currentLeftProp?.value || "0px";
                      const convertedRight = convertLeftToRight(leftVal, widthProp.value, dims.width);
                      newCss.push({ property: "right", value: convertedRight });
                    } else {
                      const rightVal = currentRightProp?.value || "0px";
                      const convertedLeft = convertRightToLeft(rightVal, widthProp.value, dims.width);
                      newCss.push({ property: "left", value: convertedLeft });
                    }
                    updateElement({ ...selectedEl, css: newCss });
                  };

                  const handleVerticalToggle = (targetProp) => {
                    const heightProp = selectedEl.css.find((c) => c.property === "height") || { value: "100px" };
                    const currentTopProp = selectedEl.css.find((c) => c.property === "top");
                    const currentBottomProp = selectedEl.css.find((c) => c.property === "bottom");
                    const dims = getPageDimensions(currentPage.config);

                    let newCss = selectedEl.css.filter((c) => c.property !== "top" && c.property !== "bottom");

                    if (targetProp === "bottom") {
                      const topVal = currentTopProp?.value || "0px";
                      const convertedBottom = convertTopToBottom(topVal, heightProp.value, dims.height);
                      newCss.push({ property: "bottom", value: convertedBottom });
                    } else {
                      const bottomVal = currentBottomProp?.value || "0px";
                      const convertedTop = convertBottomToTop(bottomVal, heightProp.value, dims.height);
                      newCss.push({ property: "top", value: convertedTop });
                    }
                    updateElement({ ...selectedEl, css: newCss });
                  };

                  return (
                    <div className="space-y-3">
                      <p className="text-xs font-semibold text-gray-400 border-b pb-1">
                        Quick Position
                      </p>
                      {[activeVert, activeHoriz, "width", "height", "z-index"].map((prop) => {
                        const cssProp = selectedEl.css.find((c) => c.property === prop);
                        const { num, unit } = parseValueWithUnit(cssProp?.value || "");

                        const isVert = ["top", "bottom"].includes(prop);
                        const isHoriz = ["left", "right"].includes(prop);

                        return (
                          <div key={prop} className="space-y-1.5 bg-gray-50/50 p-2 rounded-lg border border-gray-100">
                            {isVert && (
                              <div className="flex items-center justify-between mb-1">
                                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Vertical Anchor</span>
                                <div className="flex bg-gray-200 rounded-lg p-0.5 border border-gray-300">
                                  {["top", "bottom"].map((opt) => (
                                    <button
                                      key={opt}
                                      onClick={() => handleVerticalToggle(opt)}
                                      className={`px-2 py-0.5 text-[9px] font-extrabold rounded-md uppercase transition-all ${
                                        prop === opt
                                          ? "bg-white text-indigo-600 shadow-sm"
                                          : "text-gray-400 hover:text-gray-600"
                                      }`}
                                    >
                                      {opt}
                                    </button>
                                  ))}
                                </div>
                              </div>
                            )}

                            {isHoriz && (
                              <div className="flex items-center justify-between mb-1">
                                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Horizontal Anchor</span>
                                <div className="flex bg-gray-200 rounded-lg p-0.5 border border-gray-300">
                                  {["left", "right"].map((opt) => (
                                    <button
                                      key={opt}
                                      onClick={() => handleHorizontalToggle(opt)}
                                      className={`px-2 py-0.5 text-[9px] font-extrabold rounded-md uppercase transition-all ${
                                        prop === opt
                                          ? "bg-white text-indigo-600 shadow-sm"
                                          : "text-gray-400 hover:text-gray-600"
                                      }`}
                                    >
                                      {opt}
                                    </button>
                                  ))}
                                </div>
                              </div>
                            )}

                            <div className="flex items-center justify-between gap-2">
                              <span className="text-xs font-semibold text-gray-500 capitalize w-14">{prop}</span>
                              <div className="flex items-center gap-1.5 flex-1 justify-end">
                                <input
                                  type="number"
                                  value={num || ""}
                                  onChange={(e) => {
                                    const newNum = parseFloat(e.target.value) || 0;
                                    const newCss = selectedEl.css.map((c) =>
                                      c.property === prop
                                        ? { ...c, value: formatValueWithUnit(newNum, unit) }
                                        : c
                                    );
                                    if (!cssProp) {
                                      newCss.push({
                                        property: prop,
                                        value: formatValueWithUnit(newNum, unit),
                                      });
                                    }
                                    updateElement({ ...selectedEl, css: newCss });
                                    setSelectedElementId(selectedEl.id);
                                  }}
                                  className="w-20 px-2 py-1 text-xs border rounded-lg bg-white"
                                />
                                {prop !== "z-index" && (
                                  <select
                                    value={unit}
                                    onChange={(e) => {
                                      const newCss = selectedEl.css.map((c) =>
                                        c.property === prop
                                          ? { ...c, value: formatValueWithUnit(num, e.target.value) }
                                          : c
                                      );
                                      updateElement({ ...selectedEl, css: newCss });
                                    }}
                                    className="w-16 px-1 py-1 text-xs border rounded-lg bg-white"
                                  >
                                    {UNITS.map((u) => (
                                      <option key={u} value={u}>{u}</option>
                                    ))}
                                  </select>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  );
                })()}
                {selectedEl.script?.length > 0 && (
                  <div>
                    <p className="text-xs font-medium text-gray-400 mb-1">
                      Conditions ({selectedEl.script.length})
                    </p>
                  </div>
                )}
              </div>
            ) : (
              <p className="text-xs text-gray-300 text-center py-6">
                Click an element to edit properties
              </p>
            )}
          </div>
        </div>
      </div>

      <ElementEditorModal
        open={showElementEditor}
        element={selectedEl}
        onSave={updateElement}
        onClose={() => {
          setShowElementEditor(false);
        }}
        placeholderFields={getPlaceholderFields(type)}
      />
      <QREditorModal
        open={showQREditor}
        onSave={addQRElement}
        onClose={() => setShowQREditor(false)}
      />
      <CustomModal
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={() => {
          if (deleteTarget?.type === "page") deletePage(deleteTarget.idx);
          setShowDeleteConfirm(false);
        }}
        title="Delete Page"
        message="Are you sure you want to delete this page?"
        confirmText="Yes, Delete"
      />
      <DraftModal
        isOpen={showDraftModal}
        onClose={handleDiscardDraft}
        onLoad={handleLoadDraft}
        onDiscard={handleDiscardDraft}
        draftDate={
          draftData ? new Date(draftData.savedAt).toLocaleString() : ""
        }
      />
    </div>
  );
}
