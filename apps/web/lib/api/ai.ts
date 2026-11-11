import { apiFetch } from "../api-client";
import type { AiSuggestionDto, ExtractAndSuggestRequestDto } from "shared-types";

export function extractAndSuggest(token: string | null, dto: ExtractAndSuggestRequestDto) {
  return apiFetch<AiSuggestionDto>("/ai/extract-and-suggest", token, {
    method: "POST",
    body: JSON.stringify(dto),
  });
}
