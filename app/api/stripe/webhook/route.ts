import { NextResponse } from "next/server";
import Stripe from "stripe";
import { createAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";

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

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    if (session.payment_status !== "paid") {
      return NextResponse.json({ received: true });
    }

    const email = session.customer_details?.email?.toLowerCase() ?? null;
    const stripeId =
      typeof session.payment_intent === "string"
        ? session.payment_intent
        : session.id;

    const supabase = createAdminClient();

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
        stripe_id: stripeId,
        amount: session.amount_total ?? 0,
        currency: session.currency ?? "eur",
        method: "stripe",
        status: "paid",
        payer_email: email,
        description: session.metadata?.description ?? null,
        paid_at: new Date(event.created * 1000).toISOString(),
      },
      { onConflict: "stripe_id" }
    );

    if (error) {
      // 500 pour que Stripe réessaie la livraison.
      return NextResponse.json({ error: error.message }, { status: 500 });
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
