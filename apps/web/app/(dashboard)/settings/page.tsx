import { auth } from "@clerk/nextjs/server";
import { apiFetch } from "@/lib/api-client";
import type { CurrentUserDto } from "shared-types";
import { ResumeSettingsForm } from "@/components/settings/ResumeSettingsForm";

export default async function SettingsPage() {
  const { getToken } = await auth();
  const token = await getToken();
  const me = await apiFetch<CurrentUserDto>("/users/me", token);

  return (
    <div>
      <h1 className="mb-4 text-2xl font-semibold">Settings</h1>
      <ResumeSettingsForm initialResumeText={me.baseResumeText ?? ""} />
    </div>
  );
}
