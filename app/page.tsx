import Link from "next/link";
import Header from "@/app/components/Header";
import StatusBadge from "@/app/components/StatusBadge";
import { assignPayment } from "@/app/actions";
import { formatDate, formatEuros } from "@/lib/format";
import { createClient } from "@/lib/supabase/server";
import type { Payment, StudentWithPayments } from "@/lib/types";

export default async function Dashboard() {
  const supabase = await createClient();

  const [{ data: students }, { data: unassigned }] = await Promise.all([
    supabase
      .from("students")
      .select("*, payments(*)")
      .order("last_name", { ascending: true }),
    supabase
      .from("payments")
      .select("*")
      .is("student_id", null)
      .order("paid_at", { ascending: false }),
  ]);

  // Logique mensuelle : expected_amount = montant dû chaque mois (ex. 15 €).
  const monthKey = new Date().toISOString().slice(0, 7);

  const rows = ((students ?? []) as StudentWithPayments[]).map((s) => {
    const paid = s.payments.filter((p) => p.status === "paid");
    const totalPaid = paid.reduce((sum, p) => sum + p.amount, 0);
    const paidThisMonth = paid
      .filter((p) => p.paid_at.slice(0, 7) === monthKey)
      .reduce((sum, p) => sum + p.amount, 0);
    const lastPayment = paid
      .map((p) => p.paid_at)
      .sort()
      .at(-1);
    return { ...s, totalPaid, paidThisMonth, lastPayment };
  });

  const collectedThisMonth = rows.reduce((sum, r) => sum + r.paidThisMonth, 0);
  const expectedPerMonth = rows.reduce((sum, r) => sum + r.expected_amount, 0);
  const upToDate = rows.filter(
    (r) => r.expected_amount > 0 && r.paidThisMonth >= r.expected_amount
  ).length;

  return (
    <>
      <Header />
      <main className="mx-auto max-w-5xl px-4 py-8">
        <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="rounded-xl border border-gray-200 bg-white p-4">
            <p className="text-sm text-gray-500">Encaissé ce mois-ci</p>
            <p className="text-2xl font-semibold">
              {formatEuros(collectedThisMonth)}
            </p>
          </div>
          <div className="rounded-xl border border-gray-200 bg-white p-4">
            <p className="text-sm text-gray-500">Attendu par mois</p>
            <p className="text-2xl font-semibold">
              {formatEuros(expectedPerMonth)}
            </p>
          </div>
          <div className="rounded-xl border border-gray-200 bg-white p-4">
            <p className="text-sm text-gray-500">À jour ce mois-ci</p>
            <p className="text-2xl font-semibold">
              {upToDate} / {rows.length}
            </p>
          </div>
        </div>

        {(unassigned ?? []).length > 0 && (
          <section className="mb-8 rounded-xl border border-amber-300 bg-amber-50 p-4">
            <h2 className="mb-3 font-semibold text-amber-900">
              Paiements Stripe non associés ({(unassigned ?? []).length})
            </h2>
            <p className="mb-3 text-sm text-amber-800">
              Ces paiements ont été reçus mais l&apos;email ne correspond à
              aucun académicien. Associe-les manuellement.
            </p>
            <ul className="space-y-2">
              {((unassigned ?? []) as Payment[]).map((p) => (
                <li
                  key={p.id}
                  className="flex flex-wrap items-center gap-3 rounded-md bg-white p-3 text-sm"
                >
                  <span className="font-medium">{formatEuros(p.amount)}</span>
                  <span className="text-gray-500">
                    {formatDate(p.paid_at)}
                  </span>
                  <span className="text-gray-500">
                    {p.payer_email ?? "email inconnu"}
                  </span>
                  <form action={assignPayment} className="ml-auto flex gap-2">
                    <input type="hidden" name="payment_id" value={p.id} />
                    <select
                      name="student_id"
                      required
                      className="rounded-md border border-gray-300 px-2 py-1 text-sm"
                      defaultValue=""
                    >
                      <option value="" disabled>
                        Choisir un académicien…
                      </option>
                      {rows.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.last_name} {s.first_name}
                        </option>
                      ))}
                    </select>
                    <button
                      type="submit"
                      className="rounded-md bg-gray-900 px-3 py-1 text-white hover:bg-gray-700"
                    >
                      Associer
                    </button>
                  </form>
                </li>
              ))}
            </ul>
          </section>
        )}

        <div className="mb-4 flex items-center justify-between">
          <h1 className="text-lg font-semibold">Académiciens</h1>
          <Link
            href="/students/new"
            className="rounded-md bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-700"
          >
            + Ajouter
          </Link>
        </div>

        <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 text-left text-gray-500">
                <th className="px-4 py-3 font-medium">Nom</th>
                <th className="px-4 py-3 font-medium">Ce mois-ci</th>
                <th className="px-4 py-3 font-medium">Total payé</th>
                <th className="px-4 py-3 font-medium">Dernier paiement</th>
                <th className="px-4 py-3 font-medium">Statut</th>
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-gray-400">
                    Aucun académicien pour l&apos;instant. Ajoute le premier !
                  </td>
                </tr>
              )}
              {rows.map((s) => (
                <tr
                  key={s.id}
                  className="border-b border-gray-100 last:border-0 hover:bg-gray-50"
                >
                  <td className="px-4 py-3">
                    <Link
                      href={`/students/${s.id}`}
                      className="font-medium hover:underline"
                    >
                      {s.last_name} {s.first_name}
                    </Link>
                    <div className="text-xs text-gray-400">{s.email}</div>
                  </td>
                  <td className="px-4 py-3">
                    {formatEuros(s.paidThisMonth)}
                  </td>
                  <td className="px-4 py-3">{formatEuros(s.totalPaid)}</td>
                  <td className="px-4 py-3">
                    {s.lastPayment ? formatDate(s.lastPayment) : "—"}
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge
                      totalPaid={s.paidThisMonth}
                      expected={s.expected_amount}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </main>
    </>
  );
}
