import Header from "@/app/components/Header";
import { createStudent } from "@/app/actions";

export default async function NewStudentPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;

  return (
    <>
      <Header />
      <main className="mx-auto max-w-xl px-4 py-8">
        <h1 className="mb-6 text-lg font-semibold">Ajouter un académicien</h1>
        {error && (
          <p className="mb-4 rounded-md bg-red-50 p-3 text-sm text-red-700">
            Erreur : {error}
          </p>
        )}
        <form
          action={createStudent}
          className="space-y-4 rounded-xl border border-gray-200 bg-white p-6"
        >
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1 block text-sm font-medium">Prénom *</label>
              <input
                name="first_name"
                required
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">Nom *</label>
              <input
                name="last_name"
                required
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
              />
            </div>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">Email</label>
            <input
              type="email"
              name="email"
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
            />
            <p className="mt-1 text-xs text-gray-400">
              Important : c&apos;est cet email qui permet d&apos;associer
              automatiquement les paiements Stripe.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1 block text-sm font-medium">Téléphone</label>
              <input
                name="phone"
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">Classe</label>
              <input
                name="class_name"
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
              />
            </div>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">
              Montant attendu (€)
            </label>
            <input
              name="expected_amount"
              type="number"
              step="0.01"
              min="0"
              defaultValue="0"
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">Notes</label>
            <textarea
              name="notes"
              rows={2}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
            />
          </div>
          <button
            type="submit"
            className="rounded-md bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-700"
          >
            Enregistrer
          </button>
        </form>
      </main>
    </>
  );
}
