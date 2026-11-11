import { apiFetch } from "../api-client";
import type { FollowUpReminderDto } from "shared-types";

type ReminderWithApplication = FollowUpReminderDto & {
  application: { id: string; company: string; role: string };
};

export function getReminders(token: string | null) {
  return apiFetch<ReminderWithApplication[]>("/reminders", token);
}

export function dismissReminder(token: string | null, id: string) {
  return apiFetch<FollowUpReminderDto>(`/reminders/${id}/dismiss`, token, { method: "PATCH" });
}
