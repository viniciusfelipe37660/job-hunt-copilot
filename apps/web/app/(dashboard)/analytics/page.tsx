import { auth } from "@clerk/nextjs/server";
import { getFunnel, getSkillResponseRate, getWeeklyVolume } from "@/lib/api/analytics";
import { FunnelChart } from "@/components/analytics/FunnelChart";
import { SkillResponseRateChart } from "@/components/analytics/SkillResponseRateChart";
import { WeeklyVolumeChart } from "@/components/analytics/WeeklyVolumeChart";

export default async function AnalyticsPage() {
  const { getToken } = await auth();
  const token = await getToken();
  const [funnel, skillResponseRate, weeklyVolume] = await Promise.all([
    getFunnel(token),
    getSkillResponseRate(token),
    getWeeklyVolume(token),
  ]);

  return (
    <div className="flex flex-col gap-8">
      <h1 className="text-2xl font-semibold">Analytics</h1>
      <section>
        <h2 className="mb-2 text-lg font-semibold">Funil por status</h2>
        <FunnelChart data={funnel} />
      </section>
      <section>
        <h2 className="mb-2 text-lg font-semibold">Taxa de resposta por skill</h2>
        <SkillResponseRateChart data={skillResponseRate} />
      </section>
      <section>
        <h2 className="mb-2 text-lg font-semibold">Volume de candidaturas por semana</h2>
        <WeeklyVolumeChart data={weeklyVolume} />
      </section>
    </div>
  );
}
