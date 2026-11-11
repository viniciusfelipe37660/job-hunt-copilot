import { auth } from "@clerk/nextjs/server";
import { apiFetch } from "@/lib/api-client";
import type { ApplicationDto } from "shared-types";
import { ApplicationDetail } from "@/components/applications/ApplicationDetail";

export default async function ApplicationDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { getToken } = await auth();
  const token = await getToken();
  const application = await apiFetch<ApplicationDto>(`/applications/${id}`, token);

  return <ApplicationDetail application={application} />;
}
