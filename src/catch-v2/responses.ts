import { CatchResponseSchema, type CatchResponse } from "./schemas";

export function parseCatchResponse(input: unknown): CatchResponse {
  return CatchResponseSchema.parse(input);
}

export function requiresDurableFollowUp(response: CatchResponse): boolean {
  return response.type === "reschedule";
}
