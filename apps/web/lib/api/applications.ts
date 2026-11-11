import { apiFetch } from "../api-client";
import type {
  ApplicationDto,
  CreateApplicationDto,
  UpdateApplicationDto,
  MoveApplicationDto,
} from "shared-types";

export function getApplications(token: string | null) {
  return apiFetch<ApplicationDto[]>("/applications", token);
}

export function createApplication(token: string | null, dto: CreateApplicationDto) {
  return apiFetch<ApplicationDto>("/applications", token, {
    method: "POST",
    body: JSON.stringify(dto),
  });
}

export function updateApplication(token: string | null, id: string, dto: UpdateApplicationDto) {
  return apiFetch<ApplicationDto>(`/applications/${id}`, token, {
    method: "PATCH",
    body: JSON.stringify(dto),
  });
}

export function moveApplication(token: string | null, id: string, dto: MoveApplicationDto) {
  return apiFetch<ApplicationDto>(`/applications/${id}/move`, token, {
    method: "PATCH",
    body: JSON.stringify(dto),
  });
}

export function deleteApplication(token: string | null, id: string) {
  return apiFetch<void>(`/applications/${id}`, token, { method: "DELETE" });
}
