import Link from "next/link";
import { signOut } from "@/app/actions";

export default function Header() {
  return (
    <header className="border-b border-gray-200 bg-white">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
        <Link href="/" className="font-semibold">
          Académie Delaveau Photo <span className="text-gray-400">·</span>{" "}
          <span className="text-gray-500">CRM</span>
        </Link>
        <form action={signOut}>
          <button
            type="submit"
            className="text-sm text-gray-500 hover:text-gray-900"
          >
            Déconnexion
          </button>
        </form>
      </div>
    </header>
  );
}
