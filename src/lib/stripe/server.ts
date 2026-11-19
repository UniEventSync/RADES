import "server-only";
import Stripe from "stripe";

let stripeClient: Stripe | null = null;

export function getStripe() {
  const secret = process.env.STRIPE_SECRET_KEY;
  const publishable = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;
  if (!secret || !publishable) throw new Error("Stripe test keys are not configured. Add STRIPE_SECRET_KEY and NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY.");
  if (!secret.startsWith("sk_test_") || !publishable.startsWith("pk_test_")) throw new Error("RADES accepts Stripe test-mode keys only. Use an sk_test_ secret and pk_test_ publishable key.");
  stripeClient ??= new Stripe(secret);
  return stripeClient;
}
