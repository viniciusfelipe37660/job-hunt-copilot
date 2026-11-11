"use client";

import { useDroppable } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import type { ApplicationDto, ApplicationStatus } from "shared-types";
import { ApplicationCard } from "./ApplicationCard";

const COLUMN_LABELS: Record<ApplicationStatus, string> = {
  SAVED: "Saved",
  APPLIED: "Applied",
  INTERVIEW: "Interview",
  OFFER: "Offer",
  REJECTED: "Rejected",
};

export function KanbanColumn({
  status,
  applications,
  onCardClick,
}: {
  status: ApplicationStatus;
  applications: ApplicationDto[];
  onCardClick: (application: ApplicationDto) => void;
}) {
  const { setNodeRef } = useDroppable({ id: status });

  return (
    <div className="flex w-64 flex-shrink-0 flex-col rounded-md bg-gray-50 p-2">
      <h3 className="mb-2 px-1 text-sm font-semibold text-gray-700">
        {COLUMN_LABELS[status]} <span className="text-gray-400">({applications.length})</span>
      </h3>
      <div ref={setNodeRef} className="flex min-h-[4rem] flex-col gap-2">
        <SortableContext items={applications.map((a) => a.id)} strategy={verticalListSortingStrategy}>
          {applications.map((application) => (
            <ApplicationCard
              key={application.id}
              application={application}
              onClick={() => onCardClick(application)}
            />
          ))}
        </SortableContext>
      </div>
    </div>
  );
}
