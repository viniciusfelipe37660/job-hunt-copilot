"use client";

export default function DashboardError({ reset }: { error: Error; reset: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 p-16 text-center">
      <p className="text-sm text-gray-600">
        Algo deu errado ao carregar esta página. O backend pode estar fora do ar.
      </p>
      <button
        onClick={reset}
        className="rounded border border-gray-300 px-4 py-2 text-sm hover:bg-gray-50"
      >
        Tentar novamente
      </button>
    </div>
  );
}
