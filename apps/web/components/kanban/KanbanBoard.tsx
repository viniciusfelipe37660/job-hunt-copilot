"use client";

import { useMemo, useState } from "react";
import { useAuth } from "@clerk/nextjs";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  closestCorners,
  type DragEndEvent,
  type DragOverEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import { ApplicationStatus, type ApplicationDto } from "shared-types";
import { createApplication, deleteApplication, moveApplication, updateApplication } from "@/lib/api/applications";
import { KanbanColumn } from "./KanbanColumn";
import { ApplicationCard } from "./ApplicationCard";
import { ApplicationModal, type ApplicationFormValues } from "./ApplicationModal";

const STATUSES: ApplicationStatus[] = [
  ApplicationStatus.SAVED,
  ApplicationStatus.APPLIED,
  ApplicationStatus.INTERVIEW,
  ApplicationStatus.OFFER,
  ApplicationStatus.REJECTED,
];

function groupByStatus(applications: ApplicationDto[]) {
  const groups = Object.fromEntries(STATUSES.map((s) => [s, [] as ApplicationDto[]])) as Record<
    ApplicationStatus,
    ApplicationDto[]
  >;
  for (const app of applications) {
    groups[app.status].push(app);
  }
  for (const status of STATUSES) {
    groups[status].sort((a, b) => a.boardPosition - b.boardPosition);
  }
  return groups;
}

export function KanbanBoard({ initialApplications }: { initialApplications: ApplicationDto[] }) {
  const { getToken } = useAuth();
  const [columns, setColumns] = useState(() => groupByStatus(initialApplications));
  const [activeApplication, setActiveApplication] = useState<ApplicationDto | null>(null);
  const [editingApplication, setEditingApplication] = useState<ApplicationDto | null>(null);
  const [isCreating, setIsCreating] = useState(false);

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

  const allApplications = useMemo(() => Object.values(columns).flat(), [columns]);

  function findContainer(id: string): ApplicationStatus | undefined {
    if ((STATUSES as string[]).includes(id)) return id as ApplicationStatus;
    return STATUSES.find((status) => columns[status].some((a) => a.id === id));
  }

  function handleDragStart(event: DragStartEvent) {
    const application = allApplications.find((a) => a.id === event.active.id);
    setActiveApplication(application ?? null);
  }

  function handleDragOver(event: DragOverEvent) {
    const { active, over } = event;
    if (!over) return;

    const activeContainer = findContainer(String(active.id));
    const overContainer = findContainer(String(over.id));
    if (!activeContainer || !overContainer || activeContainer === overContainer) return;

    setColumns((prev) => {
      const activeItems = prev[activeContainer];
      const activeIndex = activeItems.findIndex((a) => a.id === active.id);
      if (activeIndex === -1) return prev;

      const overItems = prev[overContainer];
      const overIndex = overItems.findIndex((a) => a.id === over.id);
      const insertAt = overIndex >= 0 ? overIndex : overItems.length;

      const moved = { ...activeItems[activeIndex], status: overContainer };
      return {
        ...prev,
        [activeContainer]: activeItems.filter((a) => a.id !== active.id),
        [overContainer]: [...overItems.slice(0, insertAt), moved, ...overItems.slice(insertAt)],
      };
    });
  }

  async function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    setActiveApplication(null);
    if (!over) return;

    const container = findContainer(String(active.id));
    if (!container) return;

    const items = columns[container];
    const oldIndex = items.findIndex((a) => a.id === active.id);
    const overContainer = findContainer(String(over.id));
    const overIndex = overContainer === container ? items.findIndex((a) => a.id === over.id) : items.length - 1;

    const targetIndex = overIndex >= 0 ? overIndex : items.length - 1;

    const reordered = [...items];
    if (oldIndex !== targetIndex && oldIndex !== -1) {
      const [moved] = reordered.splice(oldIndex, 1);
      reordered.splice(targetIndex, 0, moved);
      setColumns((prev) => ({ ...prev, [container]: reordered }));
    }

    const token = await getToken();
    try {
      await moveApplication(token, String(active.id), { status: container, targetIndex });
    } catch {
      // Best-effort: a full reload would reconcile client state with the server on failure.
    }
  }

  async function handleSaveNew(values: ApplicationFormValues) {
    const token = await getToken();
    const created = await createApplication(token, {
      company: values.company,
      role: values.role,
      jobUrl: values.jobUrl || undefined,
      jobDescription: values.jobDescription || undefined,
      notes: values.notes || undefined,
    });
    setColumns((prev) => ({ ...prev, SAVED: [...prev.SAVED, created] }));
  }

  async function handleSaveEdit(values: ApplicationFormValues) {
    if (!editingApplication) return;
    const token = await getToken();
    const updated = await updateApplication(token, editingApplication.id, {
      company: values.company,
      role: values.role,
      jobUrl: values.jobUrl || undefined,
      jobDescription: values.jobDescription || undefined,
      notes: values.notes || undefined,
    });
    setColumns((prev) => ({
      ...prev,
      [updated.status]: prev[updated.status].map((a) => (a.id === updated.id ? updated : a)),
    }));
  }

  async function handleDelete() {
    if (!editingApplication) return;
    const token = await getToken();
    await deleteApplication(token, editingApplication.id);
    setColumns((prev) => ({
      ...prev,
      [editingApplication.status]: prev[editingApplication.status].filter((a) => a.id !== editingApplication.id),
    }));
    setEditingApplication(null);
  }

  return (
    <div>
      <button
        onClick={() => setIsCreating(true)}
        className="mb-4 rounded bg-black px-4 py-2 text-sm text-white hover:bg-gray-800"
      >
        + Nova candidatura
      </button>
      {allApplications.length === 0 && (
        <p className="mb-4 text-sm text-gray-400">
          Nenhuma candidatura ainda — clique em "+ Nova candidatura" para começar a organizar sua busca.
        </p>
      )}
      <DndContext
        id="kanban-board"
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
      >
        <div className="flex gap-4 overflow-x-auto pb-4">
          {STATUSES.map((status) => (
            <KanbanColumn
              key={status}
              status={status}
              applications={columns[status]}
              onCardClick={setEditingApplication}
            />
          ))}
        </div>
        <DragOverlay>
          {activeApplication && <ApplicationCard application={activeApplication} onClick={() => {}} />}
        </DragOverlay>
      </DndContext>

      {isCreating && (
        <ApplicationModal
          application={null}
          onClose={() => setIsCreating(false)}
          onSave={handleSaveNew}
        />
      )}
      {editingApplication && (
        <ApplicationModal
          application={editingApplication}
          onClose={() => setEditingApplication(null)}
          onSave={handleSaveEdit}
          onDelete={handleDelete}
        />
      )}
    </div>
  );
}
