import { apiFetch } from "../api-client";
import type { FunnelPointDto, SkillResponseRateDto, WeeklyVolumePointDto } from "shared-types";

export function getFunnel(token: string | null) {
  return apiFetch<FunnelPointDto[]>("/analytics/funnel", token);
}

export function getSkillResponseRate(token: string | null) {
  return apiFetch<SkillResponseRateDto[]>("/analytics/response-rate-by-skill", token);
}

export function getWeeklyVolume(token: string | null) {
  return apiFetch<WeeklyVolumePointDto[]>("/analytics/weekly-volume", token);
}
