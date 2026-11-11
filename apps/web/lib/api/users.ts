import { apiFetch } from "../api-client";
import type { CurrentUserDto } from "shared-types";

export function getMe(token: string | null) {
  return apiFetch<CurrentUserDto>("/users/me", token);
}

export function updateBaseResume(token: string | null, baseResumeText: string) {
  return apiFetch<CurrentUserDto>("/users/me/resume", token, {
    method: "PATCH",
    body: JSON.stringify({ baseResumeText }),
  });
}
