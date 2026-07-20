import Stripe from "stripe";

let stripe;
function getStripe() {
  if (!stripe) {
    if (!process.env.STRIPE_SECRET_KEY) {
      throw new Error("STRIPE_SECRET_KEY is not configured");
    }
    stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
  }
  return stripe;
}

export async function createPaymentIntent(amount, currency = "gbp", customerId) {
  try {
    const paymentIntent = await getStripe().paymentIntents.create({
      amount: Math.round(amount * 100),
      currency,
      customer: customerId || undefined,
      automatic_payment_methods: { enabled: true },
    });

    return {
      success: true,
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
    };
  } catch (error) {
    console.error("Stripe createPaymentIntent error:", error.message);
    return { success: false, error: error.message };
  }
}

export async function createCustomer(email, name) {
  try {
    const customer = await getStripe().customers.create({ email, name });
    return { success: true, customerId: customer.id };
  } catch (error) {
    console.error("Stripe createCustomer error:", error.message);
    return { success: false, error: error.message };
  }
}
