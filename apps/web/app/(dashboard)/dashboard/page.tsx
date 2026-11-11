import { auth } from "@clerk/nextjs/server";
import { apiFetch } from "@/lib/api-client";
import type { ApplicationDto } from "shared-types";
import { KanbanBoard } from "@/components/kanban/KanbanBoard";
import { RemindersWidget } from "@/components/reminders/RemindersWidget";

export default async function DashboardPage() {
  const { getToken } = await auth();
  const token = await getToken();
  const applications = await apiFetch<ApplicationDto[]>("/applications", token);

  return (
    <div>
      <h1 className="mb-4 text-2xl font-semibold">Kanban</h1>
      <RemindersWidget />
      <KanbanBoard initialApplications={applications} />
    </div>
  );
}
