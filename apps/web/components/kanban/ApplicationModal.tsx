"use client";

import { useState } from "react";
import Link from "next/link";
import type { ApplicationDto } from "shared-types";

export interface ApplicationFormValues {
  company: string;
  role: string;
  jobUrl: string;
  jobDescription: string;
  notes: string;
}

export function ApplicationModal({
  application,
  onClose,
  onSave,
  onDelete,
}: {
  application: ApplicationDto | null;
  onClose: () => void;
  onSave: (values: ApplicationFormValues) => Promise<void>;
  onDelete?: () => Promise<void>;
}) {
  const [values, setValues] = useState<ApplicationFormValues>({
    company: application?.company ?? "",
    role: application?.role ?? "",
    jobUrl: application?.jobUrl ?? "",
    jobDescription: application?.jobDescription ?? "",
    notes: application?.notes ?? "",
  });
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      await onSave(values);
      onClose();
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4">
      <div className="w-full max-w-lg rounded-lg bg-white p-6 shadow-xl">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold">
            {application ? "Editar candidatura" : "Nova candidatura"}
          </h2>
          {application && (
            <Link href={`/applications/${application.id}`} className="text-sm text-blue-600 hover:underline">
              Analisar com IA →
            </Link>
          )}
        </div>
        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <input
            required
            placeholder="Empresa"
            value={values.company}
            onChange={(e) => setValues({ ...values, company: e.target.value })}
            className="rounded border border-gray-300 px-3 py-2 text-sm"
          />
          <input
            required
            placeholder="Cargo"
            value={values.role}
            onChange={(e) => setValues({ ...values, role: e.target.value })}
            className="rounded border border-gray-300 px-3 py-2 text-sm"
          />
          <input
            placeholder="URL da vaga (opcional)"
            value={values.jobUrl}
            onChange={(e) => setValues({ ...values, jobUrl: e.target.value })}
            className="rounded border border-gray-300 px-3 py-2 text-sm"
          />
          <textarea
            placeholder="Descrição da vaga"
            value={values.jobDescription}
            onChange={(e) => setValues({ ...values, jobDescription: e.target.value })}
            rows={4}
            className="rounded border border-gray-300 px-3 py-2 text-sm"
          />
          <textarea
            placeholder="Notas"
            value={values.notes}
            onChange={(e) => setValues({ ...values, notes: e.target.value })}
            rows={2}
            className="rounded border border-gray-300 px-3 py-2 text-sm"
          />
          <div className="mt-2 flex items-center justify-between">
            <div>
              {application && onDelete && (
                <button
                  type="button"
                  onClick={onDelete}
                  className="text-sm text-red-600 hover:underline"
                >
                  Excluir
                </button>
              )}
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={onClose}
                className="rounded border border-gray-300 px-4 py-2 text-sm hover:bg-gray-50"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={saving}
                className="rounded bg-black px-4 py-2 text-sm text-white hover:bg-gray-800 disabled:opacity-50"
              >
                {saving ? "Salvando..." : "Salvar"}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
