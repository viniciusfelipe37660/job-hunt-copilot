"use client";

import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import type { WeeklyVolumePointDto } from "shared-types";

export function WeeklyVolumeChart({ data }: { data: WeeklyVolumePointDto[] }) {
  if (data.length === 0) {
    return <p className="text-sm text-gray-400">Sem candidaturas ainda.</p>;
  }

  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ left: 0 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="weekStart" tick={{ fontSize: 11 }} />
          <YAxis allowDecimals={false} />
          <Tooltip />
          <Line type="monotone" dataKey="count" stroke="#111827" strokeWidth={2} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
