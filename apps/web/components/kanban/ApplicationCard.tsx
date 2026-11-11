"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import type { ApplicationDto } from "shared-types";

export function ApplicationCard({
  application,
  onClick,
}: {
  application: ApplicationDto;
  onClick: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: application.id,
  });

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      {...attributes}
      {...listeners}
      onClick={onClick}
      className={`cursor-grab rounded-md border border-gray-200 bg-white p-3 shadow-sm active:cursor-grabbing ${
        isDragging ? "opacity-40" : ""
      }`}
    >
      <p className="font-medium text-sm">{application.role}</p>
      <p className="text-xs text-gray-500">{application.company}</p>
      {application.skillTags.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1">
          {application.skillTags.slice(0, 3).map((tag) => (
            <span key={tag} className="rounded bg-gray-100 px-1.5 py-0.5 text-[10px] text-gray-600">
              {tag}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
