/**
 * Payment boundary — DISABLED.
 *
 * Registration on the public site collects information only. Nothing here
 * charges anyone, and nothing here is wired to a route: this file exists so
 * that adding Stripe (or a bank transfer, JazzCash, EasyPaisa…) later is a new
 * provider plus a call site, not a rebuild of the registration flow.
 *
 * The contract a future provider must satisfy:
 *
 *   createIntent({ registration, amount, currency }) -> { reference, redirectUrl }
 *   getStatus(reference)                            -> "pending" | "paid" | "failed"
 *
 * Deliberately absent, and to stay absent while payments are off:
 *   - any card, bank, or wallet field on `Registration`
 *   - any payment status the registration flow depends on
 *   - any webhook route, any secret, any SDK call
 *
 * `stripe` is a dependency of this project already, used by the separate
 * partner/ATC deposit flow. That is unrelated to public registration and must
 * not be reached from it.
 */

/** Master switch. Nothing may take payment while this is false. */
export const PAYMENTS_ENABLED = false;

/** Providers a future implementation may register. Informational today. */
export const KNOWN_PROVIDERS = ["stripe", "bank_transfer", "jazzcash", "easypaisa"];

/**
 * The only provider that exists. Every method refuses, loudly, so a
 * half-finished integration fails in development rather than silently
 * pretending a payment succeeded in production.
 */
export const disabledProvider = {
  id: "disabled",
  label: "Payments disabled",
  enabled: false,
  async createIntent() {
    throw new Error("Payments are disabled: registration does not take payment.");
  },
  async getStatus() {
    throw new Error("Payments are disabled: there is nothing to look up.");
  },
};

/**
 * Resolve the active provider. Always the disabled one today.
 * Call sites should check `PAYMENTS_ENABLED` first and skip payment entirely.
 */
export function getPaymentProvider() {
  return disabledProvider;
}

/**
 * What the public registration page is allowed to say about payment.
 *
 * Returning `{ enabled: false }` is what keeps the UI honest — it renders a
 * support panel, not a checkout, and never a disabled-looking payment form
 * that implies one is coming in this session.
 */
export function paymentUiState() {
  return { enabled: false, providers: [] };
}
