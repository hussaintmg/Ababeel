"use client";

import React, { useState, useEffect } from "react";
import { Landmark, Copy, Check, QrCode, ShieldCheck, AlertCircle } from "lucide-react";

export default function BankDetailsBlock({ p = {}, s = {}, data = null, sampleMode = false }) {
  const [copiedKey, setCopiedKey] = useState(null);
  const [liveInfo, setLiveInfo] = useState(null);
  const [loading, setLoading] = useState(false);

  const useOwner = p.source === "owner_settings" || (p.source !== "custom" && p.useOwnerSettings !== false);

  useEffect(() => {
    if (!useOwner) return;
    let isMounted = true;
    setLoading(true);
    fetch("/api/public/payment-info")
      .then((res) => res.json())
      .then((resData) => {
        if (isMounted && resData?.data) {
          setLiveInfo(resData.data);
        }
      })
      .catch((err) => {
        console.warn("Could not fetch owner bank details:", err?.message);
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });
    return () => {
      isMounted = false;
    };
  }, [useOwner]);

  const bankName = (useOwner && liveInfo?.bankName) || p.bankName || (sampleMode ? "Barclays Bank UK" : "");
  const accountTitle = (useOwner && liveInfo?.accountTitle) || p.accountTitle || (sampleMode ? "Ababeel International Ltd" : "");
  const accountNumber = (useOwner && liveInfo?.accountNumber) || p.accountNumber || (sampleMode ? "98765432" : "");
  const iban = (useOwner && liveInfo?.iban) || p.iban || (sampleMode ? "GB29BARC20000098765432" : "");
  const sortCode = (useOwner && (liveInfo?.sortCode || liveInfo?.branchCode)) || p.sortCode || p.branchCode || (sampleMode ? "20-00-00" : "");
  const swiftBic = (useOwner && (liveInfo?.swiftBic || liveInfo?.swiftCode)) || p.swiftBic || p.swiftCode || (sampleMode ? "BARCGB22" : "");
  const instructions = p.instructions || (useOwner && liveInfo?.bankIntro) || "Please use your registration reference or full name as the transfer reference.";
  const title = p.title || (useOwner && liveInfo?.bankTitle) || "Bank Transfer Details";
  const subtitle = p.subtitle || (useOwner && liveInfo?.bankSubtitle) || "Official Company Payment Account";
  const footnote = p.footnote || (useOwner && liveInfo?.footnote) || "Transfers usually take 1-2 business days to clear. Please keep your receipt.";
  const qrCodeImage = p.qrImage || p.qrCodeImage || (useOwner && (liveInfo?.qrImage || liveInfo?.qrCode));
  const showQr = p.showQr !== false;

  // Dynamic or fixed amount due
  let resolvedAmount = p.amountDue || "";
  if (data?.course?.price && !resolvedAmount) {
    resolvedAmount = `${data.course.currencySymbol || p.currency || "£"}${data.course.price}`;
  } else if (resolvedAmount && !resolvedAmount.includes("£") && !resolvedAmount.includes("$")) {
    resolvedAmount = `${p.currency || "£"}${resolvedAmount}`;
  }

  const copyToClipboard = (text, key) => {
    if (!text || typeof navigator === "undefined") return;
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const rows = [
    { key: "bank", label: "Bank Name", value: bankName },
    { key: "title", label: "Account Title", value: accountTitle },
    { key: "acc", label: "Account Number", value: accountNumber, copyable: true },
    { key: "iban", label: "IBAN", value: iban, copyable: true },
    { key: "sort", label: "Sort Code", value: sortCode, copyable: true },
    { key: "swift", label: "SWIFT / BIC", value: swiftBic, copyable: true },
  ].filter((r) => Boolean(r.value));

  const showCopy = p.showCopyButtons !== false;
  const isInsideContainer = s?._inContainer || false;

  return (
    <section className={`w-full ${isInsideContainer ? "p-0" : "max-w-3xl mx-auto px-4 py-8"}`}>
      <div className="rounded-2xl border border-slate-200/80 bg-white p-6 sm:p-7 shadow-sm transition-all hover:shadow-md">
        {/* Header */}
        <div className="flex items-start justify-between gap-4 pb-5 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
              <Landmark size={20} />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900 leading-tight">{title}</h3>
              <p className="text-xs text-slate-500 mt-0.5">{subtitle}</p>
            </div>
          </div>
          {p.showAmountDue !== false && resolvedAmount ? (
            <div className="text-right">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 block">Amount Due</span>
              <span className="text-lg font-extrabold text-blue-600">{resolvedAmount}</span>
            </div>
          ) : null}
        </div>

        {/* Instructions */}
        {instructions ? (
          <div className="my-4 p-3.5 rounded-xl bg-blue-50/60 border border-blue-100/80 flex items-start gap-2.5 text-xs text-blue-900 leading-relaxed">
            <ShieldCheck size={16} className="text-blue-600 shrink-0 mt-0.5" />
            <span>{instructions}</span>
          </div>
        ) : null}

        {/* Rows */}
        {rows.length === 0 && !loading ? (
          <div className="py-6 text-center text-xs text-slate-400">
            <AlertCircle size={20} className="mx-auto mb-2 text-slate-300" />
            Bank details have not been configured yet.
          </div>
        ) : (
          <div className="divide-y divide-slate-100 my-2">
            {rows.map((r) => (
              <div key={r.key} className="py-3 flex items-center justify-between gap-3 text-sm">
                <span className="text-slate-500 text-xs font-medium">{r.label}</span>
                <div className="flex items-center gap-2">
                  <span className="font-mono font-semibold text-slate-900 select-all">{r.value}</span>
                  {showCopy && r.copyable ? (
                    <button
                      type="button"
                      onClick={() => copyToClipboard(r.value, r.key)}
                      title={`Copy ${r.label}`}
                      className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-colors"
                    >
                      {copiedKey === r.key ? (
                        <Check size={14} className="text-emerald-600" />
                      ) : (
                        <Copy size={14} />
                      )}
                    </button>
                  ) : null}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Optional QR Code */}
        {showQr && qrCodeImage ? (
          <div className="mt-4 pt-4 border-t border-slate-100 text-center">
            <p className="text-xs font-medium text-slate-600 mb-2 flex items-center justify-center gap-1.5">
              <QrCode size={14} /> Scan to Pay via Banking App
            </p>
            <img
              src={qrCodeImage}
              alt="Bank Transfer QR Code"
              className="max-h-40 mx-auto rounded-xl border border-slate-200 p-1 bg-white shadow-xs"
            />
          </div>
        ) : null}

        {/* Footnote */}
        {footnote ? (
          <p className="mt-4 pt-3 border-t border-slate-100 text-[11px] text-slate-400 text-center leading-relaxed">
            {footnote}
          </p>
        ) : null}
      </div>
    </section>
  );
}
