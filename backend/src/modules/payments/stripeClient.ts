import Stripe from "stripe";

let stripeClient: Stripe | null = null;

export function isStripeConfigured() {
  return Boolean(process.env.STRIPE_SECRET_KEY && process.env.STRIPE_WEBHOOK_SECRET);
}

export function getStripeClient(): Stripe {
  if (!isStripeConfigured()) {
    throw new Error("stripe_not_configured");
  }
  if (!stripeClient) {
    stripeClient = new Stripe(process.env.STRIPE_SECRET_KEY!, {
      apiVersion: "2026-02-25.clover"
    });
  }
  return stripeClient;
}

export function getStripeConfigurationSummary() {
  return {
    configured: isStripeConfigured(),
    mode: process.env.STRIPE_SECRET_KEY?.startsWith("sk_test_") ? "test" : isStripeConfigured() ? "live" : "not_configured",
    webhook_endpoint: process.env.STRIPE_WEBHOOK_ENDPOINT || null
  };
}
