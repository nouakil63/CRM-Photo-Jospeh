import { createClient } from "@supabase/supabase-js";

// Client avec la clé service_role : réservé aux routes serveur (webhook Stripe).
// Ne jamais exposer cette clé côté client.
export function createAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  );
}
