"use client";

import { useState } from "react";
import Link from "next/link";
import { useAuth } from "@clerk/nextjs";
import type { AiSuggestionDto, ApplicationDto } from "shared-types";
import { extractAndSuggest } from "@/lib/api/ai";

export function ApplicationDetail({ application }: { application: ApplicationDto }) {
  const { getToken } = useAuth();
  const [jobDescription, setJobDescription] = useState(application.jobDescription ?? "");
  const [suggestion, setSuggestion] = useState<AiSuggestionDto | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleAnalyze() {
    setAnalyzing(true);
    setError(null);
    try {
      const token = await getToken();
      const result = await extractAndSuggest(token, {
        applicationId: application.id,
        jobDescriptionText: jobDescription,
      });
      setSuggestion(result);
    } catch {
      setError("Falha ao analisar a vaga. Tente novamente.");
    } finally {
      setAnalyzing(false);
    }
  }

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
      <div>
        <Link href="/dashboard" className="mb-2 inline-block text-sm text-gray-500 hover:underline">
          ← Voltar ao Kanban
        </Link>
        <h1 className="text-2xl font-semibold">{application.role}</h1>
        <p className="mb-4 text-gray-500">{application.company}</p>

        <label className="mb-1 block text-sm font-medium text-gray-700">Descrição da vaga</label>
        <textarea
          value={jobDescription}
          onChange={(e) => setJobDescription(e.target.value)}
          rows={12}
          placeholder="Cole aqui o texto da descrição da vaga..."
          className="w-full rounded border border-gray-300 p-3 text-sm"
        />
        <button
          onClick={handleAnalyze}
          disabled={analyzing || !jobDescription.trim()}
          className="mt-3 rounded bg-black px-4 py-2 text-sm text-white hover:bg-gray-800 disabled:opacity-50"
        >
          {analyzing ? "Analisando..." : "Analisar com IA"}
        </button>
        {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
      </div>

      <div>
        <h2 className="mb-2 text-lg font-semibold">Sugestões da IA</h2>
        {!suggestion && (
          <p className="text-sm text-gray-400">
            Cole a descrição da vaga e clique em "Analisar com IA" pra ver skills extraídas, bullets de
            currículo sugeridos e um parágrafo de carta de apresentação.
          </p>
        )}
        {suggestion && (
          <div className="flex flex-col gap-4">
            {suggestion.modelUsed === "mock" && (
              <div className="rounded border border-amber-300 bg-amber-50 p-2 text-xs text-amber-700">
                Resultado de demonstração (mock) — configure ANTHROPIC_API_KEY no backend para usar a Claude de verdade.
              </div>
            )}
            <div>
              <h3 className="mb-1 text-sm font-semibold text-gray-700">Skills extraídas</h3>
              <div className="flex flex-wrap gap-1.5">
                {suggestion.extractedSkills.map((skill) => (
                  <span key={skill} className="rounded bg-gray-100 px-2 py-1 text-xs text-gray-700">
                    {skill}
                  </span>
                ))}
              </div>
            </div>
            <div>
              <h3 className="mb-1 text-sm font-semibold text-gray-700">Principais requisitos</h3>
              <ul className="list-inside list-disc text-sm text-gray-700">
                {suggestion.keyRequirements.map((req, i) => (
                  <li key={i}>{req}</li>
                ))}
              </ul>
            </div>
            <div>
              <h3 className="mb-1 text-sm font-semibold text-gray-700">Bullets sugeridos</h3>
              <ul className="flex flex-col gap-2">
                {suggestion.resumeBullets.map((bullet, i) => (
                  <li key={i} className="rounded border border-gray-200 p-2 text-sm text-gray-700">
                    {bullet}
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h3 className="mb-1 text-sm font-semibold text-gray-700">Carta de apresentação</h3>
              <p className="rounded border border-gray-200 p-2 text-sm text-gray-700">
                {suggestion.coverLetterSnippet}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
