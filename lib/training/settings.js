/**
 * Training-platform settings, resolved from the CMS "global" document.
 *
 * Every read here is optional: if the database is unreachable the public pages
 * must still render with the built-in defaults, which is why the caller gets
 * merged defaults rather than a rejected promise.
 *
 * Server-only.
 */
import { getGlobalSettings } from "@/lib/cms";
import { DEFAULT_GLOBAL_SETTINGS } from "@/lib/cmsDefaults";

const FALLBACK = DEFAULT_GLOBAL_SETTINGS.training;

export async function getTrainingSettings() {
  try {
    const settings = await getGlobalSettings();
    return settings?.training || FALLBACK;
  } catch {
    return FALLBACK;
  }
}

/**
 * Site contact details plus the training settings, which is what the
 * registration page's help panel needs: its own fields where the owner filled
 * them in, the site-wide contact details where they left them blank.
 */
/**
 * The public payment information: the company's own bank-transfer details and
 * nothing else. `stripeEnabled` is deliberately NOT exposed here — it is a
 * stored preference for a future integration and must never change what the
 * public page renders while the payment provider is disabled.
 */
export async function getPaymentInfo() {
  const training = await getTrainingSettings();
  const p = training?.payment || FALLBACK.payment || {};
  return {
    showBankDetails: !!p.showBankDetails,
    bankTitle: p.bankTitle || "",
    bankIntro: p.bankIntro || "",
    bankName: p.bankName || "",
    accountTitle: p.accountTitle || "",
    accountNumber: p.accountNumber || "",
    iban: p.iban || "",
    sortCode: p.sortCode || "",
    swiftBic: p.swiftBic || "",
    footnote: p.footnote || "",
  };
}

export async function getRegistrationPanel() {
  let settings;
  try {
    settings = await getGlobalSettings();
  } catch {
    settings = DEFAULT_GLOBAL_SETTINGS;
  }
  const training = settings?.training || FALLBACK;
  const panel = training.registrationPanel || FALLBACK.registrationPanel;
  const contact = settings?.contact || {};
  return {
    enabled: panel.enabled !== false,
    title: panel.title || FALLBACK.registrationPanel.title,
    body: panel.body || FALLBACK.registrationPanel.body,
    phone: panel.phone || contact.phone || "",
    whatsapp: panel.whatsapp || contact.whatsapp || "",
    email: panel.email || contact.supportEmail || contact.infoEmail || "",
    hours: panel.hours || "",
    footnote: panel.footnote || "",
  };
}
