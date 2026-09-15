import { signIn } from "@/app/actions";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;

  return (
    <main className="flex min-h-screen items-center justify-center p-4">
      <div className="w-full max-w-sm rounded-xl border border-gray-200 bg-white p-8 shadow-sm">
        <h1 className="mb-1 text-xl font-semibold">Académie Delaveau Photo</h1>
        <p className="mb-6 text-sm text-gray-500">
          CRM Photo — espace de Joseph
        </p>
        {error && (
          <p className="mb-4 rounded-md bg-red-50 p-3 text-sm text-red-700">
            Identifiants incorrects.
          </p>
        )}
        <form action={signIn} className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium">Email</label>
            <input
              type="email"
              name="email"
              required
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-gray-900 focus:outline-none"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">
              Mot de passe
            </label>
            <input
              type="password"
              name="password"
              required
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-gray-900 focus:outline-none"
            />
          </div>
          <button
            type="submit"
            className="w-full rounded-md bg-gray-900 py-2 text-sm font-medium text-white hover:bg-gray-700"
          >
            Se connecter
          </button>
        </form>
      </div>
    </main>
  );
}
