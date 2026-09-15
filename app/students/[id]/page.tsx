import { notFound } from "next/navigation";
import Header from "@/app/components/Header";
import StatusBadge from "@/app/components/StatusBadge";
import {
  addManualPayment,
  deletePayment,
  deleteStudent,
  updateStudent,
} from "@/app/actions";
import { formatDate, formatEuros, METHOD_LABELS } from "@/lib/format";
import { createClient } from "@/lib/supabase/server";
import type { StudentWithPayments } from "@/lib/types";

export default async function StudentPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data } = await supabase
    .from("students")
    .select("*, payments(*)")
    .eq("id", id)
    .single();

  if (!data) notFound();
  const student = data as StudentWithPayments;

  const paid = student.payments.filter((p) => p.status === "paid");
  const totalPaid = paid.reduce((sum, p) => sum + p.amount, 0);
  const monthKey = new Date().toISOString().slice(0, 7);
  const paidThisMonth = paid
    .filter((p) => p.paid_at.slice(0, 7) === monthKey)
    .reduce((sum, p) => sum + p.amount, 0);
  const payments = [...student.payments].sort((a, b) =>
    b.paid_at.localeCompare(a.paid_at)
  );

  return (
    <>
      <Header />
      <main className="mx-auto max-w-3xl px-4 py-8">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold">
              {student.last_name} {student.first_name}
            </h1>
            <p className="text-sm text-gray-500">
              {formatEuros(paidThisMonth)} payé ce mois-ci sur{" "}
              {formatEuros(student.expected_amount)} — {formatEuros(totalPaid)}{" "}
              au total
            </p>
          </div>
          <StatusBadge
            totalPaid={paidThisMonth}
            expected={student.expected_amount}
          />
        </div>

        <section className="mb-8 rounded-xl border border-gray-200 bg-white p-6">
          <h2 className="mb-4 font-semibold">Fiche</h2>
          <form action={updateStudent} className="space-y-4">
            <input type="hidden" name="id" value={student.id} />
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="mb-1 block text-sm font-medium">
                  Prénom
                </label>
                <input
                  name="first_name"
                  defaultValue={student.first_name}
                  required
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium">Nom</label>
                <input
                  name="last_name"
                  defaultValue={student.last_name}
                  required
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="mb-1 block text-sm font-medium">Email</label>
                <input
                  type="email"
                  name="email"
                  defaultValue={student.email ?? ""}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium">
                  Téléphone
                </label>
                <input
                  name="phone"
                  defaultValue={student.phone ?? ""}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                />
              </div>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">
                Montant mensuel (€)
              </label>
              <input
                name="expected_amount"
                type="number"
                step="0.01"
                min="0"
                defaultValue={(student.expected_amount / 100).toFixed(2)}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">Notes</label>
              <textarea
                name="notes"
                rows={2}
                defaultValue={student.notes ?? ""}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
              />
            </div>
            <button
              type="submit"
              className="rounded-md bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-700"
            >
              Mettre à jour
            </button>
          </form>
        </section>

        <section className="mb-8 rounded-xl border border-gray-200 bg-white p-6">
          <h2 className="mb-4 font-semibold">Paiements</h2>
          {payments.length === 0 && (
            <p className="mb-4 text-sm text-gray-400">Aucun paiement.</p>
          )}
          <ul className="mb-6 divide-y divide-gray-100">
            {payments.map((p) => (
              <li key={p.id} className="flex items-center gap-3 py-3 text-sm">
                <span className="font-medium">{formatEuros(p.amount)}</span>
                <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs">
                  {METHOD_LABELS[p.method] ?? p.method}
                </span>
                <span className="text-gray-500">{formatDate(p.paid_at)}</span>
                {p.description && (
                  <span className="text-gray-400">{p.description}</span>
                )}
                {!p.stripe_id && (
                  <form action={deletePayment} className="ml-auto">
                    <input type="hidden" name="id" value={p.id} />
                    <input
                      type="hidden"
                      name="student_id"
                      value={student.id}
                    />
                    <button
                      type="submit"
                      className="text-xs text-red-500 hover:underline"
                    >
                      Supprimer
                    </button>
                  </form>
                )}
              </li>
            ))}
          </ul>

          <h3 className="mb-3 text-sm font-semibold text-gray-700">
            Ajouter un paiement manuel (espèces, chèque, virement…)
          </h3>
          <form
            action={addManualPayment}
            className="flex flex-wrap items-end gap-3"
          >
            <input type="hidden" name="student_id" value={student.id} />
            <div>
              <label className="mb-1 block text-xs text-gray-500">
                Montant (€)
              </label>
              <input
                name="amount"
                type="number"
                step="0.01"
                min="0.01"
                required
                className="w-28 rounded-md border border-gray-300 px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs text-gray-500">Moyen</label>
              <select
                name="method"
                className="rounded-md border border-gray-300 px-3 py-2 text-sm"
                defaultValue="especes"
              >
                <option value="especes">Espèces</option>
                <option value="cheque">Chèque</option>
                <option value="virement">Virement</option>
                <option value="autre">Autre</option>
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs text-gray-500">Date</label>
              <input
                name="paid_at"
                type="date"
                className="rounded-md border border-gray-300 px-3 py-2 text-sm"
              />
            </div>
            <div className="grow">
              <label className="mb-1 block text-xs text-gray-500">
                Description
              </label>
              <input
                name="description"
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
              />
            </div>
            <button
              type="submit"
              className="rounded-md bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-700"
            >
              Ajouter
            </button>
          </form>
        </section>

        <form action={deleteStudent}>
          <input type="hidden" name="id" value={student.id} />
          <button
            type="submit"
            className="text-sm text-red-500 hover:underline"
          >
            Supprimer cet académicien
          </button>
        </form>
      </main>
    </>
  );
}
