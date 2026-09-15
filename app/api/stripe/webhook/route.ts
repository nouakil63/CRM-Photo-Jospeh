import { NextResponse } from "next/server";
import Stripe from "stripe";
import { createAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";

async function recordPayment(p: {
  email: string | null;
  stripeId: string;
  amount: number;
  currency: string;
  description: string | null;
  paidAt: string;
}): Promise<string | null> {
  const supabase = createAdminClient();
  const email = p.email?.toLowerCase() ?? null;

  let studentId: string | null = null;
  if (email) {
    const { data: student } = await supabase
      .from("students")
      .select("id")
      .eq("email", email)
      .maybeSingle();
    studentId = student?.id ?? null;
  }

  const { error } = await supabase.from("payments").upsert(
    {
      student_id: studentId,
      stripe_id: p.stripeId,
      amount: p.amount,
      currency: p.currency,
      method: "stripe",
      status: "paid",
      payer_email: email,
      description: p.description,
      paid_at: p.paidAt,
    },
    { onConflict: "stripe_id" }
  );
  return error ? error.message : null;
}

// Reçoit les événements Stripe et enregistre les paiements dans Supabase.
// L'association à un académicien se fait par email ; si aucun ne correspond,
// le paiement apparaît dans "Paiements non associés" sur le tableau de bord.
export async function POST(request: Request) {
  const body = await request.text();
  const signature = request.headers.get("stripe-signature");

  if (!signature) {
    return NextResponse.json({ error: "Signature absente" }, { status: 400 });
  }

  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch {
    return NextResponse.json({ error: "Signature invalide" }, { status: 400 });
  }

  // Paiement ponctuel (Payment Link "one-time"). Les checkouts d'abonnement
  // sont ignorés ici : leur argent arrive via invoice.paid, sinon on
  // compterait le premier mois deux fois.
  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    if (session.payment_status !== "paid" || session.mode === "subscription") {
      return NextResponse.json({ received: true });
    }

    const error = await recordPayment({
      email: session.customer_details?.email ?? null,
      stripeId:
        typeof session.payment_intent === "string"
          ? session.payment_intent
          : session.id,
      amount: session.amount_total ?? 0,
      currency: session.currency ?? "eur",
      description: session.metadata?.description ?? null,
      paidAt: new Date(event.created * 1000).toISOString(),
    });
    if (error) {
      // 500 pour que Stripe réessaie la livraison.
      return NextResponse.json({ error }, { status: 500 });
    }
  }

  // Abonnement (ex. 15 €/mois) : chaque échéance mensuelle, première incluse.
  if (event.type === "invoice.paid") {
    const invoice = event.data.object as Stripe.Invoice;
    const error = await recordPayment({
      email: invoice.customer_email ?? null,
      stripeId: invoice.id ?? `invoice_${event.id}`,
      amount: invoice.amount_paid ?? 0,
      currency: invoice.currency ?? "eur",
      description: "Abonnement mensuel",
      paidAt: new Date(event.created * 1000).toISOString(),
    });
    if (error) {
      return NextResponse.json({ error }, { status: 500 });
    }
  }

  if (event.type === "charge.refunded") {
    const charge = event.data.object as Stripe.Charge;
    const stripeId =
      typeof charge.payment_intent === "string"
        ? charge.payment_intent
        : charge.id;
    const supabase = createAdminClient();
    await supabase
      .from("payments")
      .update({ status: "refunded" })
      .eq("stripe_id", stripeId);
  }

  return NextResponse.json({ received: true });
}
