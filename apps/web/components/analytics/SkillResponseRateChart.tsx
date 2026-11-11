"use client";

import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import type { SkillResponseRateDto } from "shared-types";

export function SkillResponseRateChart({ data }: { data: SkillResponseRateDto[] }) {
  if (data.length === 0) {
    return <p className="text-sm text-gray-400">Sem dados ainda — analise vagas com IA para extrair skills.</p>;
  }

  const chartData = data.slice(0, 10).map((d) => ({
    skill: d.skill,
    "Taxa de resposta (%)": Math.round(d.responseRate * 100),
  }));

  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={chartData} layout="vertical" margin={{ left: 20 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis type="number" domain={[0, 100]} unit="%" />
          <YAxis type="category" dataKey="skill" width={100} />
          <Tooltip />
          <Bar dataKey="Taxa de resposta (%)" fill="#2563eb" radius={[0, 4, 4, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
