import Link from "next/link";

export default function LandingPage() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-6 px-6 text-center">
      <h1 className="text-4xl font-bold tracking-tight">Job Hunt Copilot</h1>
      <p className="max-w-xl text-balance text-gray-600">
        Organize sua busca de emprego em um Kanban, gere bullets de currículo
        sob medida para cada vaga com IA e nunca mais perca um follow-up.
      </p>
      <div className="flex gap-4">
        <Link
          href="/sign-up"
          className="rounded-md bg-black px-5 py-2.5 text-sm font-medium text-white hover:bg-gray-800"
        >
          Criar conta
        </Link>
        <Link
          href="/sign-in"
          className="rounded-md border border-gray-300 px-5 py-2.5 text-sm font-medium hover:bg-gray-50"
        >
          Entrar
        </Link>
      </div>
    </main>
  );
}
