"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@clerk/nextjs";
import Link from "next/link";
import { dismissReminder, getReminders } from "@/lib/api/reminders";
import type { FollowUpReminderDto } from "shared-types";

type ReminderWithApplication = FollowUpReminderDto & {
  application: { id: string; company: string; role: string };
};

export function RemindersWidget() {
  const { getToken } = useAuth();
  const [reminders, setReminders] = useState<ReminderWithApplication[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    (async () => {
      const token = await getToken();
      const data = await getReminders(token);
      setReminders(data);
      setLoaded(true);
    })();
  }, [getToken]);

  async function handleDismiss(id: string) {
    const token = await getToken();
    await dismissReminder(token, id);
    setReminders((prev) => prev.filter((r) => r.id !== id));
  }

  if (!loaded || reminders.length === 0) return null;

  return (
    <div className="mb-4 flex flex-col gap-2 rounded-md border border-amber-200 bg-amber-50 p-3">
      {reminders.map((reminder) => (
        <div key={reminder.id} className="flex items-center justify-between gap-3 text-sm">
          <Link href={`/applications/${reminder.application.id}`} className="text-amber-900 hover:underline">
            {reminder.message}
          </Link>
          <button
            onClick={() => handleDismiss(reminder.id)}
            className="shrink-0 text-xs text-amber-700 hover:underline"
          >
            Dispensar
          </button>
        </div>
      ))}
    </div>
  );
}
