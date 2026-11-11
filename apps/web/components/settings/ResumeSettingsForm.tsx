"use client";

import { useState } from "react";
import { useAuth } from "@clerk/nextjs";
import { updateBaseResume } from "@/lib/api/users";

export function ResumeSettingsForm({ initialResumeText }: { initialResumeText: string }) {
  const { getToken } = useAuth();
  const [resumeText, setResumeText] = useState(initialResumeText);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  async function handleSave() {
    setSaving(true);
    setSaved(false);
    try {
      const token = await getToken();
      await updateBaseResume(token, resumeText);
      setSaved(true);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="max-w-2xl">
      <label className="mb-1 block text-sm font-medium text-gray-700">
        Currículo-base (texto puro)
      </label>
      <p className="mb-2 text-xs text-gray-500">
        Usado como contexto para a IA sugerir bullets e carta de apresentação sob medida para cada vaga.
      </p>
      <textarea
        value={resumeText}
        onChange={(e) => {
          setResumeText(e.target.value);
          setSaved(false);
        }}
        rows={16}
        placeholder="Cole aqui o texto do seu currículo..."
        className="w-full rounded border border-gray-300 p-3 text-sm"
      />
      <div className="mt-3 flex items-center gap-3">
        <button
          onClick={handleSave}
          disabled={saving}
          className="rounded bg-black px-4 py-2 text-sm text-white hover:bg-gray-800 disabled:opacity-50"
        >
          {saving ? "Salvando..." : "Salvar"}
        </button>
        {saved && <span className="text-sm text-green-600">Salvo!</span>}
      </div>
    </div>
  );
}
